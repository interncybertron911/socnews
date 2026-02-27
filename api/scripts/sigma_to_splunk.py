#!/usr/bin/env python3
import sys
from sigma.collection import SigmaCollection
from sigma.backends.splunk import SplunkBackend

def main():
    yaml_text = sys.stdin.read()
    if not yaml_text.strip():
        print("ERROR: empty yaml", file=sys.stderr)
        sys.exit(2)

    collection = SigmaCollection.from_yaml(yaml_text)
    backend = SplunkBackend()

    queries = []
    for rule in collection.rules:
        q = backend.convert_rule(rule)
        if isinstance(q, list):
            queries.extend(q)
        else:
            queries.append(q)

    sys.stdout.write("\n\n".join([str(x) for x in queries if x]).strip())

if __name__ == "__main__":
    main()
