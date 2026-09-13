---
title: "MPS 到 PQC：Tensor Network 预训练量子电路"
description: "记录把经典可训练 MPS 映射为参数化量子电路初始点时需要回答的问题。"
pubDate: 2026-09-10
tags:
  - MPS
  - PQC
  - Quantum Machine Learning
category: "Quantum Machine Learning"
draft: false
featured: false
---

参数化量子电路（PQC）的训练对初始化敏感。一个自然想法是：先在经典环境中训练结构受控的 MPS，再把它编码成量子电路，作为变分优化的起点。

## 为什么从 MPS 开始

MPS 具有明确的 bond dimension，可以在经典机器上稳定训练和检查。若目标态的纠缠结构适合低秩表示，MPS 还能提供比随机电路参数更有信息的初始化。

设某个切分下的 Schmidt rank 为 $r$，那么对应量子线路需要足够的辅助空间或门深来表示这些相关性。映射并不是免费的：

- MPS 的 canonical form 会影响局部等距映射的构造；
- bond dimension 不一定是 $2$ 的整数次幂，需要 padding 或压缩；
- 编译到具体 gate set 后，线路深度可能明显增长；
- 映射误差与后续 PQC 优化误差需要分开记录。

## 一个可验证的流程

1. 在小数据集或小系统上训练 MPS。
2. 将每个 canonical tensor 补全为 unitary 或 isometry。
3. 分解为目标硬件支持的门。
4. 比较映射前后的 state fidelity。
5. 以映射参数初始化 PQC，再进行微调。

可以先用如下指标跟踪映射质量：

$$
F = |\langle \psi_{\mathrm{MPS}} | \psi_{\mathrm{PQC}} \rangle|^2.
$$

## 下一步

这篇模板后续可以补充具体的张量到 unitary 算法、线路图，以及随机初始化与 MPS 初始化的训练曲线对比。
