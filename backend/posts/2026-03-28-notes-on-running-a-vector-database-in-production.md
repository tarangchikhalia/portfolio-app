---
title: "Notes on running a vector database in production"
date: 2026-03-28
tags: [ai, infrastructure, milvus]
excerpt: "Vector databases are deceptively simple in benchmarks and surprisingly subtle in production. After running Milvus for a year, here is what I would tell my past self."
---

Vector databases are deceptively simple in benchmarks and surprisingly subtle in production. After running Milvus through real traffic for a year, here is what I would tell my past self.

### Embeddings drift

The data in your store today reflects the embedding model you used at the time of insertion. Change models, and your similarity scores change with them. This is obvious in retrospect; it is not obvious when you are deciding whether to upgrade.

### Index choice is a load-test, not a config

HNSW vs IVF vs FLAT looks like a tunable in the docs. In practice it is a commitment that affects rebuild times, RAM ceilings, and how the system behaves during a partition. Choose based on your worst day, not your best day.

### Observability is not optional

Latency percentiles for vector search look fine on average and terrifying at p99. Wire it into Langfuse or your tracer of choice from day one — debugging an opaque retrieval pipeline at 3am is a special kind of pain.
