# Welcome to Zoopy

Zoopy is a tool for building and simulating causal loop diagrams — visual maps of how things influence each other over time.

## Quick start

**Draw a node:** use the ink tool and draw a circle. Give it a name in the sidebar.

**Draw an arrow:** start drawing from one node and end on another. The sidebar lets you set whether the relationship reinforces (+) or inverts (–) the effect.

**Run a simulation:** switch to Play mode and click a node to send a signal through the system. Watch how it flows and amplifies or dampens across the diagram.

## Edit mode tools

| Tool | What it does |
|------|-------------|
| Ink | Draw nodes (circles) and arrows |
| Text | Add a floating label anywhere on the canvas |
| Hand | Drag nodes, arrows, and labels to reposition them |
| Eraser | Delete nodes, arrows, or labels |

Click any element to select it and edit its properties in the sidebar.

## Sidebar panels

**When nothing is selected** — the global panel appears. Set the overall mode (Simple or Advanced), camera behavior, and save/load your diagram.

**When a node is selected** — set its name, color, starting fill level, and (in Advanced mode) size, overflow thresholds, and interactivity.

**When an arrow is selected** — set the relationship direction (same/inverted effect) and, in Advanced mode, signal filtering, valency, and color behavior.

## Saving your work

- **Save as link** — generates a compressed URL you can bookmark or share (Ctrl-S)
- **Save as file** — downloads a `.loopy` file to your computer
- **Load from file** — opens a previously saved `.loopy` file

## Simple vs Advanced mode

**Simple mode** is the default. Nodes and arrows have a small set of properties — enough to model most systems.

**Advanced mode** unlocks extra controls: node size and capacity, overflow/underflow thresholds, signal filtering, color logic, and more. Enable it with the mode slider at the top of the sidebar.

## Tips

- Draw multiple arrows between the same two nodes to make a stronger relationship.
- Draw a longer arrow to introduce a time delay in the signal.
- Use the **?** buttons next to any feature to see an explanation and examples for that specific setting.

---

# Global

The global panel (visible when nothing is selected) controls diagram-wide settings.

**Mode** — switches between Simple and Advanced. Advanced unlocks extra node and arrow properties.

**Color logic** *(Advanced)* — when enabled, signal color carries meaning and can be filtered or converted by arrows.

**Camera** — controls how the viewport behaves during simulation:
- *Resize to scene* — zooms to fit all nodes
- *Follow signals* — camera tracks active signals as they travel
- *User controllable* — free pan and zoom

<hr id="choice_0"/>

# Node

A node represents a variable, quantity, or concept in your system. Its fill level (shown visually as how full the circle is) changes as signals flow through the diagram.

**Name** — the label shown inside the circle.

**Color** — the hue of the node. In color logic mode this affects signal behavior.

**Starting fill** — how full the node is at the start of a simulation (Empty, 25%, 50%, 75%, Full, or Dead).

**Size** *(Advanced)* — controls the node's capacity. Tiny nodes act as booleans; larger nodes hold more signal before overflowing.

**Overflow / Underflow threshold** *(Advanced)* — the fill level at which the node emits overflow or underflow signals to connected arrows.

**Aggregation latency** *(Advanced)* — adds a delay before incoming signals are applied to the node's fill level.

**Explode** *(Advanced)* — causes the node to be destroyed when it reaches full or empty.

**Interactivity** *(Advanced)* — controls whether the user can click the node during Play mode to send signals manually.

<hr id="choice_1"/>

<iframe width="500" height="440" style="border: 0;" src="?embed=1&signal=[1,1]&data=[[[1,718,355,1,%22something%22,4,1,0,0,0,0],[2,720,514,1,%22something%2520else%22,5,1,0,0,0,0]],[[2,1,94,-1,0,0,-1,-1,%22%22,0],[1,2,89,1,0,0,-1,-1,%22%22,0]],[[924,443,%22need%2520ideas%2520on%2520what%2520to%250Asimulate%253F%2520how%2520about%253A%250A%250A%25E3%2583%25BBtechnology%250A%25E3%2583%25BBenvironment%250A%25E3%2583%25BBeconomics%250A%25E3%2583%25BBbusiness%250A%25E3%2583%25BBpolitics%250A%25E3%2583%25BBculture%250A%25E3%2583%25BBpsychology%250A%250Aor%2520better%2520yet%252C%2520a%250A*combination*%2520of%250Athose%2520systems.%250Ahappy%2520modeling!%22,0,-1]],[2,1,0,0,0]%5D"></iframe>
