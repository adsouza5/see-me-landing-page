from .graph import build_graph
import json

def main():
    app = build_graph()
    init = {"brief": "Build SeeMe hero", "target_image": "assets/target/hero.png"}
    # Cap the loop so it doesn’t error while iterating
    for delta in app.stream(init, config={"recursion_limit": 25}):
        print(json.dumps(delta, indent=2))


if __name__ == "__main__":
    main()
