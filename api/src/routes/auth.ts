import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";

import { config } from "../config";

const router = Router();
const JWT_SECRET = config.jwtSecret;

// SIGNUP
router.post("/signup", async (req, res) => {
    try {
        const { name, username, password, type } = req.body;
        console.log(`[AUTH] Signup attempt for username: ${username}. Password length: ${password?.length}`);

        // Stricter Validation: 8+ chars, 1+ Uppercase, 1+ Lowercase, 1+ Number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            console.log(`[AUTH] Signup REJECTED: Insecure password for ${username}`);
            return res.status(400).json({
                ok: false,
                error: "Password must be at least 8 characters long and contain uppercase, lowercase, and numbers."
            });
        }

        // Check exists
        const exists = await UserModel.findOne({ username });
        if (exists) return res.status(400).json({ ok: false, error: "Username already exists" });

        // Hash
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            name,
            username,
            password: hashedPassword,
            type: type || "user"
        });

        return res.json({ ok: true, message: "User created successfully" });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e.message });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await UserModel.findOne({ username });
        if (!user) return res.status(401).json({ ok: false, error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ ok: false, error: "Invalid credentials" });

        // Generate Token
        const token = jwt.sign(
            { id: user._id, username: user.username, type: user.type, name: user.name },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.json({
            ok: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                type: user.type
            }
        });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e.message });
    }
});

// Authentication Middleware
const protect = async (req: any, res: any, next: any) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const user = await UserModel.findById(decoded.id).select("-password");
            if (!user) {
                return res.status(401).json({ ok: false, error: "User not found" });
            }
            req.user = user;
            return next();
        } catch (error) {
            return res.status(401).json({ ok: false, error: "Not authorized, token failed" });
        }
    }
    if (!token) {
        return res.status(401).json({ ok: false, error: "Not authorized, no token" });
    }
};

// GET PROFILE
router.get("/profile", protect, async (req: any, res: any) => {
    res.json({ ok: true, user: req.user });
});

// UPDATE PROFILE
router.patch("/profile", protect, async (req: any, res: any) => {
    try {
        const user = await UserModel.findById(req.user._id);
        if (!user) return res.status(404).json({ ok: false, error: "User not found" });

        const { name, username, password } = req.body;

        if (name) user.name = name;
        if (username) {
            const exists = await UserModel.findOne({ username, _id: { $ne: user._id } });
            if (exists) return res.status(400).json({ ok: false, error: "Username already exists" });
            user.username = username;
        }

        if (password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    ok: false,
                    error: "Password must be at least 8 characters long and contain uppercase, lowercase, and numbers."
                });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        // Regenerate token for profile changes
        const token = jwt.sign(
            { id: user._id, username: user.username, type: user.type, name: user.name },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            ok: true,
            token,
            user: {
                name: user.name,
                username: user.username,
                type: user.type
            }
        });
    } catch (e: any) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// Admin-Only Middleware
const adminOnly = (req: any, res: any, next: any) => {
    if (req.user && req.user.type === "admin") {
        return next();
    }
    return res.status(403).json({ ok: false, error: "Access denied. Admin privileges required." });
};

// GET ALL USERS (Admin Only)
router.get("/users", protect, adminOnly, async (req, res) => {
    try {
        const users = await UserModel.find().select("-password").sort({ createdAt: -1 });
        res.json({ ok: true, users });
    } catch (e: any) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// DELETE USER (Admin Only)
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent admin from deleting themselves
        if (id === req.user._id.toString()) {
            return res.status(400).json({ ok: false, error: "Cannot delete your own administrative account." });
        }
        await UserModel.findByIdAndDelete(id);
        res.json({ ok: true, message: "User deleted successfully." });
    } catch (e: any) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// UPDATE USER (Admin Only)
router.patch("/users/:id", protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(id);
        if (!user) return res.status(404).json({ ok: false, error: "User not found" });

        const { name, username, password, type } = req.body;

        if (name) user.name = name;
        if (username) {
            const exists = await UserModel.findOne({ username, _id: { $ne: id } });
            if (exists) return res.status(400).json({ ok: false, error: "Username already exists" });
            user.username = username;
        }

        if (type) user.type = type;

        if (password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    ok: false,
                    error: "Password must be at least 8 characters long and contain uppercase, lowercase, and numbers."
                });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        res.json({ ok: true, message: "User updated successfully" });
    } catch (e: any) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

export default router;
