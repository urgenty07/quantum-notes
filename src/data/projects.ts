export interface Project {
  name: string;
  description: string;
  stack: string[];
  status: "进行中" | "持续维护" | "计划中";
  github?: string;
  articleSlugs: string[];
}

// 在这里维护项目列表；有公开仓库后再填写 github，避免产生无效链接。
export const projects: Project[] = [
  {
    name: "DMRG Implementation",
    description: "从张量收缩、有效哈密顿量到截断策略，逐步实现一个可读的 two-site DMRG。",
    stack: ["Python", "NumPy", "SciPy", "MPS"],
    status: "进行中",
    articleSlugs: ["dmrg-from-scratch"]
  },
  {
    name: "AlphaTensor Quantum Reproduction",
    description: "复现量子电路优化中的 signature tensor 表示与分解流程。",
    stack: ["Python", "JAX", "TensorGame"],
    status: "计划中",
    articleSlugs: ["alphatensor-quantum-notes"]
  },
  {
    name: "MPS → PQC",
    description: "探索使用 Tensor Network 预训练参数化量子电路的映射与压缩方法。",
    stack: ["Python", "PennyLane", "Tensor Network"],
    status: "进行中",
    articleSlugs: ["mps-to-pqc"]
  },
  {
    name: "myflow",
    description: "用于整理研究阅读、实验记录与可复现工作流的个人工具。",
    stack: ["TypeScript", "Astro"],
    status: "持续维护",
    articleSlugs: []
  }
];
