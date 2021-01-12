import { gql, useMutation } from '@apollo/client'

const VOTE_POST = gql`
  mutation votePost($id: String!) {
    votePost(id: $id) {
      __typename
      id
      votes
    }
  }
`

const PostUpvoter = ({ votes, id }) => {
  const [votePost] = useMutation(VOTE_POST)

  const upvotePost = () => {
    votePost({
      variables: {
        id,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updatePost: {
          __typename: 'Post',
          id,
          votes: votes + 1,
        },
      },
    })
  }

  return (
    <button onClick={() => upvotePost()}>
      {votes}
    </button>
  )
}

export default PostUpvoter
