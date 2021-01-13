import { useMemo } from "react";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import merge from "deepmerge";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import uniqBy from "lodash/uniqBy";
import { concatPagination } from "@apollo/client/utilities";
import { clone } from "lodash";

let apolloClient;

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: new HttpLink({
      uri: "https://share-vde.atcult.it:6443/api/graphql", // Server URL (must be absolute)
      credentials: "same-origin", // Additional fetch() options like `credentials` or `headers`
    }),
    cache: new InMemoryCache({
      typePolicies: {
        Person: {
          keyFields: ["uri"],
        },
        Query: {
          keyArgs: false,
          fields: {
            people: {
              merge(
                existing,
                incoming,
                { args: { offset = 0 } }
              ) {
                // console.log({ existing, incoming });
                // // Slicing is necessary because the existing data is immutable, and frozen in development.
                // if (!existing) {
                //   return { ...incoming, resources: [...incoming.resources] };
                // }
                // const merged = {
                //   ...existing,
                //   resources: [...existing.resources],
                // };
                // for (let i = 0; i < incoming.resources.length; ++i) {
                //   const newItem = incoming.resources.slice(0)[i];
                //   const { uri } = newItem;
                //   if (!merged.resources.find((item) => item.uri !== uri)) {
                //     merged.resources.push(incoming.resources.slice(0)[i]);
                //   }
                // }
                // console.log({ merged });
                // return merged;

                console.log({ existing, incoming });
                if (!existing) {
                  console.log({ merged1: cloneDeep({ incoming }) });
                  return cloneDeep(incoming);
                }

                const merged = cloneDeep(existing);

                const existingResources = merged.resources;
                const newResources = incoming?.resources || [];

                merged.resources = uniqBy(
                  [...existingResources, ...newResources],
                  "__ref"
                );
                console.log({ merged2: merged });
                return merged;
              },
            },
          },
        },
      },
    }),
  });
}

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();

    // Merge the existing cache into data passed from getStaticProps/getServerSideProps
    const data = merge(initialState, existingCache, {
      // combine arrays using object equality (like in sets)
      arrayMerge: (destinationArray, sourceArray) => {
        console.log("Merging existing cache with data from getStaticProps", 
        // {
        //   destinationArray,
        //   sourceArray,
        // }
        );
        const result = [
          ...sourceArray,
          ...destinationArray.filter((d) =>
            sourceArray.every((s) => !isEqual(d, s))
          ),
        ];
        console.log({ result });
        return result;
      },
    });

    // Restore the cache with the merged data
    _apolloClient.cache.restore(data);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}
