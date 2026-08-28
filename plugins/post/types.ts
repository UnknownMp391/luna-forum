import { Static, Type } from "@sinclair/typebox"

export const DateTimeSchema = Type.String({ format: 'date-time' })

export const PostSchema = Type.Object({
    title: Type.String(),
    content: Type.String(),
    authorId: Type.Number(),
    visibility: Type.Number(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
    tagId: Type.Optional(Type.String()),
})

export type Post = Static<typeof PostSchema>

export const CommentSchema = Type.Object({
    postId: Type.String(),
    content: Type.String(),
    authorId: Type.Number(),
    visibility: Type.Number(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
    parentId: Type.Optional(Type.String())
});

export type Comment = Static<typeof CommentSchema>;

export const CommentCreateSchema = Type.Object({
    postId: Type.String(),
    content: Type.String(),
    visibility: Type.Optional(Type.Number()),
    parentId: Type.Optional(Type.String())
});

export type CommentCreate = Static<typeof CommentCreateSchema>;

export const CommentUpdateSchema = Type.Object({
    content: Type.String(),
    visibility: Type.Optional(Type.Number())
});

export type CommentUpdate = Static<typeof CommentUpdateSchema>;