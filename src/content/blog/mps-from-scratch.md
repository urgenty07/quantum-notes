---
title: "从零理解 MPS"
description: "从系数张量的逐次分解出发，建立 Matrix Product State 的直观图景。"
pubDate: 2026-09-09
tags:
  - MPS
  - Tensor Network
  - SVD
category: "Tensor Network"
draft: false
featured: true
---

Matrix Product State（MPS）并不是凭空出现的一种记号。它可以从多体波函数系数张量的逐次 SVD 中自然得到，也因此把“纠缠有多复杂”转化为一个可控的矩阵维度。

## 从系数张量开始

对含有 $N$ 个格点、每个格点局域维数为 $d$ 的系统，纯态可以写成

$$
|\psi\rangle = \sum_{s_1,\ldots,s_N} C_{s_1\ldots s_N}|s_1\ldots s_N\rangle.
$$

直接保存 $C$ 需要 $d^N$ 个复数。MPS 将它近似分解为一串低阶张量：

$$
C_{s_1\ldots s_N} = A^{s_1}A^{s_2}\cdots A^{s_N}.
$$

相邻张量之间被收缩的指标称为 **bond**；它的维数 $\chi$ 称为 **bond dimension**。

## SVD 与截断

把第一个物理指标和其余指标分组，对系数矩阵做 SVD。保留最大的 $\chi$ 个奇异值，就得到第一次受控截断。重复这一过程，最终得到整条 MPS。

| 符号 | 含义 | 计算影响 |
| --- | --- | --- |
| $d$ | 局域希尔伯特空间维数 | 决定物理指标大小 |
| $N$ | 格点数 | 决定张量链长度 |
| $\chi$ | bond dimension | 控制精度与计算成本 |

> MPS 的关键并不是“把大张量拆小”，而是利用一维低纠缠态的结构，让需要保留的 $\chi$ 远小于指数维数。

## 一个最小检查

实现 MPS 时，可以先检查左正交条件。下面的伪代码展示了核心形状变化：

```python
import numpy as np

matrix = tensor.reshape(left_dim * physical_dim, right_dim)
u, singular_values, vh = np.linalg.svd(matrix, full_matrices=False)
u = u[:, :bond_dimension]
```

下一步可以继续研究 canonical form、Schmidt decomposition，以及 MPS 上局域算符期望值的高效计算。
