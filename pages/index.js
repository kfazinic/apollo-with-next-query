import { gql, NetworkStatus, useQuery } from "@apollo/client";

import ErrorMessage from "../components/ErrorMessage";
import Layout from "../components/Layout";
import Submit from "../components/Submit";
import { initializeApollo } from "../lib/apollo";

export const PEOPLE_BY_QUERY_FULL = gql`
  query PeopleByQuery($q: String!, $offset: Int, $rows: Int) {
    people(svdeql: { q: $q, offset: $offset, rows: $rows }) {
      resources {
        uri
        preferredHeading
        alternateHeadings
        birthDate
        deathDate
        identifiers {
          uri
          source
        }
      }
      totalMatches
      startOffset
      pageSize
      facets {
        name
        buckets {
          id
          label
          count
        }
      }
    }
  }
`;

export const PEOPLE_BY_QUERY_MINIMAL = gql`
  query PeopleByQuery($q: String!, $offset: Int, $rows: Int) {
    people(svdeql: { q: $q, offset: $offset, rows: $rows }) {
      resources {
        uri
        preferredHeading
      }
      totalMatches
      startOffset
      pageSize
    }
  }
`;

const queryVariables = {
  q: "people whose name does not contain xyz",
  offset: 0,
  rows: 10,
};

const IndexPage = () => {
  const { loading, error, data, fetchMore, networkStatus } = useQuery(
    PEOPLE_BY_QUERY_MINIMAL,
    {
      variables: queryVariables,
      // Setting this value to true will make the component rerender when
      // the "networkStatus" changes, so we are able to know if it is fetching
      // more data
      notifyOnNetworkStatusChange: true,
      // fetchPolicy: "network-only",
      // nextFetchPolicy: "network-only"
    }
  );

  const loadingMore = networkStatus === NetworkStatus.fetchMore;

  const loadMore = () => {
    fetchMore({
      variables: {
        offset: people.length,
      },
    });
  };

  if (error) return <ErrorMessage message="Error loading posts." />;
  if (loading && !loadingMore) return <div>Loading</div>;

  console.log({ data });
  const people = data.people.resources;
  const areMore = people.length < data.people.totalMatches;

  return (
    <Layout>
      <Submit />
      <section>
        <ul>
          {people.map((person, index) => (
            <li key={person.uri}>
              <div>
                <span>{index + 1}. </span>
                <a href={person.url}>{person.preferredHeading}</a>
              </div>
            </li>
          ))}
        </ul>
        {areMore && (
          <button onClick={() => loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Show More"}
          </button>
        )}
      </section>
    </Layout>
  );
};

export async function getStaticProps() {
  const apolloClient = initializeApollo();

  await apolloClient.query({
    query: PEOPLE_BY_QUERY_MINIMAL,
    variables: queryVariables,
  });

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
    revalidate: 1,
  };
}

export default IndexPage;
