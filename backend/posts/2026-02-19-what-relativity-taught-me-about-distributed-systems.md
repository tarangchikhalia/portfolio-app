---
title: "What relativity taught me about distributed systems"
date: 2026-02-19
tags: [physics, systems, philosophy]
excerpt: "There is no universal \"now\" in special relativity. There is also no universal \"now\" in a distributed system. The parallel runs deeper than a metaphor."
---

There is no universal "now" in special relativity. Two events that look simultaneous from one reference frame are unambiguously sequential from another. The order depends on the observer.

There is also no universal "now" in a distributed system. Two writes that arrive in one order at node A may arrive in another order at node B. The order depends on the observer. The parallel runs deeper than a metaphor.

### Lamport clocks as light cones

Leslie Lamport's logical clocks are essentially a description of light cones in software. Two events are *concurrent* if neither could have caused the other — which is exactly the spacelike-separation criterion in physics. The mathematics is uncannily similar because the constraint is the same: information cannot travel faster than the medium allows.
