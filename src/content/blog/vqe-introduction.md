---
title: "VQE 入门"
description: "用最小工作流理解 Variational Quantum Eigensolver 的量子—经典混合循环。"
pubDate: 2026-09-08
tags:
  - VQE
  - PQC
  - Quantum Computing
category: "Quantum Computing"
draft: false
featured: false
---

Variational Quantum Eigensolver（VQE）通过参数化量子态与经典优化器估计哈密顿量的基态能量。其依据是变分原理：

$$
E(\theta)=\langle\psi(\theta)|H|\psi(\theta)\rangle \ge E_0.
$$

## 最小工作流

1. 将问题哈密顿量写成 Pauli 字符串之和。
2. 选择 ansatz，并在量子设备上制备 $|\psi(\theta)\rangle$。
3. 分组测量各 Pauli 项，估计能量。
4. 经典优化器更新参数 $\theta$。
5. 重复直到能量或参数收敛。

## 需要记录什么

实验笔记至少应包含 ansatz 深度、优化器、shots、随机种子、测量分组策略和停止条件。只报告最低能量，通常不足以解释一次 VQE 实验为何成功或失败。

```json
{
  "ansatz": "hardware-efficient",
  "layers": 2,
  "optimizer": "COBYLA",
  "shots": 4096
}
```

后续可以用一个两比特哈密顿量补充端到端示例，并与精确对角化结果对照。
