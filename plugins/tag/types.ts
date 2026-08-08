export interface IdParams {
  id: string
}

export interface IdAndPostIdParams {
  id: string
  postId: string
}

export interface CreateTagBody {
  name: string
  parentId?: string
  sortOrder?: number
}

export interface UpdateTagBody {
  name?: string
  sortOrder?: number
  requireTag?: boolean
}

export interface SortTagBody {
  sortOrder: number
}

export interface MoveTagBody {
  newParentId: string | null
}

export interface ModeratorBody {
  userId: number
}

export interface PostsQuery {
  page?: number
  limit?: number
}

export interface DeletePostParams {
  id: string
  postId: string
}

export interface Post {
  tagId?: string
}