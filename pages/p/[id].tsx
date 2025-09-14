import React from "react"
import { GetServerSideProps } from "next"
import ReactMarkdown from "react-markdown"
import Layout from "../../components/Layout"
import { PostProps } from "../../components/Post"
import prisma from "../../lib/prisma";
import Router from "next/router";
import {useSession} from "next-auth/react";


export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  // const post = {
  //   id: "1",
  //   title: "Prisma is the perfect ORM for Next.js",
  //   content: "[Prisma](https://github.com/prisma/prisma) and Next.js go _great_ together!",
  //   published: false,
  //   author: {
  //     name: "Nikolas Burk",
  //     email: "burk@prisma.io",
  //   },
  // }

  const post = await prisma.post.findUnique({
    where: {
      id: String(params.id),
    },
    include: {
      author: {
        select: { name: true },
      }
    }
  });
  return {
    props: post,
  }
}

async function publishPost(id: string ) {
  await fetch(`/api/publish/${id}`, {
    method: "PUT",
  })
  await Router.push('/');
}

async function deletePost(id: string) {
  await fetch(`/api/post/${id}`, {
    method: "DELETE",
  });
  Router.push("/")
}

const Post: React.FC<PostProps> = (props) => {
  const {data: session, status} = useSession();

  if (status === 'loading') {
    return <div>Authenticating ....</div>;
  }

  const userHasValidSession = Boolean(session);
  const postBelongsToUser = session?.user?.email === props.author?.email;

  console.log({postBelongsToUser: postBelongsToUser, userHasValidSession: userHasValidSession});

  let title = props.title
  if (!props.published) {
    title = `${title} (Draft)`
  }

  return (
    <Layout>
      <div>
        <h2>{title}</h2>
        <p>By {props?.author?.name || "Unknown author"}</p>
        <ReactMarkdown children={props.content} />
        {/* TODO: BUG post seems to be created without being attached to a user */}
        { !props.published && userHasValidSession && postBelongsToUser && (
            <button onClick={() => publishPost(props.id)}>Publish</button>
        )}

        {
          userHasValidSession && postBelongsToUser && (
              <button onClick={() => deletePost(props.id)}>Delete</button>
            )
        }
      </div>
      <style jsx>{`
        .page {
          background: white;
          padding: 2rem;
        }

        .actions {
          margin-top: 2rem;
        }

        button {
          background: #ececec;
          border: 0;
          border-radius: 0.125rem;
          padding: 1rem 2rem;
        }

        button + button {
          margin-left: 1rem;
        }
      `}</style>
    </Layout>
  )
}

export default Post
