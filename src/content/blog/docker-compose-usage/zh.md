---
title: '一些常用 Docker Compose 使用技巧'
description: '常用的 Docker Compose 操作和技巧备忘录'
pubDate: '2026-11-17T16:30'
updatedDate: '2026-11-17T16:35'
tags:
  - notes
---

以下按使用场景分类整理，命令默认在 `docker-compose.yml` 所在目录执行。若需指定项目名，在 `docker compose` 后加 `-p <项目名>`。

## 一、启动与停止

| 操作                   | 命令                              | 说明                            |
| ---------------------- | --------------------------------- | ------------------------------- |
| 启动所有服务（后台）   | `docker compose up -d`            | 最常用，后台运行                |
| 启动并强制重建         | `docker compose up -d --build`    | 修改了 Dockerfile 后使用        |
| 启动指定服务           | `docker compose up -d <服务名>`   | 只启动某个服务及其依赖          |
| 前台启动（看日志）     | `docker compose up`               | 日志直接输出到终端，Ctrl+C 停止 |
| 停止服务（保留容器）   | `docker compose stop`             | 容器保留，可 `start` 恢复       |
| 停止并移除容器/网络    | `docker compose down`             | **保留数据卷**                  |
| 停止并移除容器/网络/卷 | `docker compose down -v`          | ⚠️ **删除数据卷，数据丢失**     |
| 停止并移除镜像         | `docker compose down --rmi all`   | 同时删除服务使用的镜像          |
| 重启所有服务           | `docker compose restart`          |                                 |
| 重启指定服务           | `docker compose restart <服务名>` |                                 |

## 二、查看状态与日志

| 操作                   | 命令                                      | 说明                     |
| ---------------------- | ----------------------------------------- | ------------------------ |
| 查看运行中的容器       | `docker compose ps`                       | 加 `-a` 显示已停止的     |
| 查看所有服务日志       | `docker compose logs -f`                  | `-f` 实时跟踪            |
| 查看指定服务日志       | `docker compose logs -f <服务名>`         |                          |
| 查看最近 N 行日志      | `docker compose logs --tail=100 <服务名>` |                          |
| 查看日志带时间戳       | `docker compose logs -f -t`               |                          |
| 查看服务配置（渲染后） | `docker compose config`                   | 验证 YAML 语法并展开变量 |
| 查看服务拓扑           | `docker compose top`                      | 显示各容器内进程         |

## 三、构建与镜像

| 操作         | 命令                              | 说明                     |
| ------------ | --------------------------------- | ------------------------ |
| 构建所有镜像 | `docker compose build`            |                          |
| 构建指定服务 | `docker compose build <服务名>`   |                          |
| 无缓存构建   | `docker compose build --no-cache` |                          |
| 拉取服务镜像 | `docker compose pull`             | 拉取 `image:` 指定的镜像 |
| 推送镜像     | `docker compose push`             |                          |

## 四、进入容器与执行命令

| 操作                   | 命令                                        | 说明                        |
| ---------------------- | ------------------------------------------- | --------------------------- |
| 进入容器 shell         | `docker compose exec <服务名> bash`         | 容器无 bash 时用 `sh`       |
| 执行单条命令           | `docker compose exec <服务名> <命令>`       | 如 `ls -la`                 |
| 以 root 进入           | `docker compose exec -u root <服务名> bash` | 权限不足时使用              |
| 在容器中运行一次性命令 | `docker compose run --rm <服务名> <命令>`   | 会新建容器，`--rm` 用完即删 |

> **`exec` vs `run`**：`exec` 在**已运行**的容器内执行；`run` 会**新建**一个容器执行（常用于初始化、迁移）。

## 五、扩缩容与更新

| 操作                       | 命令                                      | 说明                        |
| -------------------------- | ----------------------------------------- | --------------------------- |
| 扩容某服务到 N 个实例      | `docker compose up -d --scale <服务名>=3` | 需无固定端口映射冲突        |
| 滚动更新（重建变更的服务） | `docker compose up -d`                    | 仅重建配置/镜像有变化的服务 |
| 暂停/恢复服务              | `docker compose pause` / `unpause`        |                             |

## 六、清理

| 操作             | 命令                                                       | 说明                        |
| ---------------- | ---------------------------------------------------------- | --------------------------- |
| 删除停止的容器   | `docker compose rm`                                        | 加 `-f` 强制，`-v` 删匿名卷 |
| 清理未使用的资源 | `docker system prune`                                      | 全局清理（慎用）            |
| 删除项目所有资源 | `docker compose down --volumes --rmi all --remove-orphans` | 彻底清理该项目              |

## 七、常用组合与技巧

```bash
# 1. 改完配置后一键重建并后台启动
docker compose up -d --build

# 2. 查看某服务最近100行日志并实时跟踪
docker compose logs -f --tail=100 web

# 3. 彻底删除项目（容器+网络+卷+镜像+孤儿容器）
docker compose down -v --rmi all --remove-orphans

# 4. 只重启某个服务
docker compose restart api

# 5. 进入数据库容器执行命令
docker compose exec db psql -U postgres

# 6. 在一次性容器中跑数据库迁移
docker compose run --rm web python manage.py migrate
```

## 八、注意事项

1. **`down -v` 是危险操作**：会删除命名卷和匿名卷，数据库数据会丢失。生产环境务必确认。
2. **`--remove-orphans`**：删除那些在 compose 文件中已被移除、但容器仍存在的"孤儿"容器，改名服务后很有用。
3. **项目名**：默认取目录名。不同目录下同名服务不会冲突，但同目录多项目需用 `-p` 区分。
4. **v1 vs v2**：新版本命令是 `docker compose`（空格），旧版是 `docker-compose`（连字符）。建议统一用 v2。
5. **`exec` 前确保容器在运行**：否则报错，先用 `docker compose ps` 确认。
