---
title: "DMRG 算法学习笔记"
description: "围绕 two-site DMRG 的有效哈密顿量、局部优化与 SVD truncation 梳理主线。"
pubDate: 2026-09-13
tags:
  - DMRG
  - MPS
  - Tensor Network
  - SciPy
category: "Tensor Network"
draft: false
featured: true
---

DMRG 可以理解为：在 MPS 流形上交替优化局部张量，同时用 SVD 控制表示规模。本文只搭建实现时需要的骨架，不替代完整推导。

## 1. MPS 表示

一般多体态写作

$$
|\psi\rangle =
\sum_{s_1,\dots,s_N}
C_{s_1\dots s_N}
|s_1\dots s_N\rangle.
$$

MPS 用一串三阶张量近似系数张量 $C$。其中 bond dimension $\chi$ 决定能够表达的纠缠规模，也主导计算成本。

## 2. Two-site 更新

一次更新把相邻两个 MPS 张量合并为 $\Theta$。其余格点与 MPO 环境收缩后，得到只作用在 $\Theta$ 上的 effective Hamiltonian：

$$
H_{\mathrm{eff}}\Theta = E\Theta.
$$

实际实现中通常不显式构造巨大矩阵，而是实现一个线性算子，让迭代本征值求解器按需完成张量收缩。

```python
from scipy.sparse.linalg import eigsh

energy, theta = eigsh(
    H_eff,
    k=1,
    which="SA",
)
```

## 3. SVD truncation

局部基态求出后，将 $\Theta$ reshape 成矩阵并做 SVD：

1. 选择保留的奇异值，限制最大 $\chi$。
2. 根据 sweep 方向，把奇异值吸收到左侧或右侧张量。
3. 更新环境张量，移动到下一条 bond。

截断误差常用被丢弃奇异值平方和度量。实现时应同时记录能量变化、截断误差和最大 bond dimension，避免只凭 sweep 次数判断收敛。

## 实现检查清单

- 环境张量的指标顺序始终一致。
- `matvec` 的输入和输出 shape 完全相同。
- 左扫与右扫采用匹配的 canonical form。
- 小系统结果先与 exact diagonalization 对照。

这份模板可以继续扩展为边界条件、MPO 构造和收敛诊断的完整实现记录。
