// create a custom fetch that is wrapped around the fetch that has the authorisation header

import { GraphQLFormattedError } from "graphql"; // Corrected import

type Error = {
    message: string;
    statusCode: number; // Changed to number from string
}

const customFetch = async (url: string, options: RequestInit) => {
    const accessToken = localStorage.getItem('access_token');

    const headers = (options.headers || {}) as Record<string, string>;
    
    return await fetch(url, {
        ...options,
        headers: {
            ...headers,
            Authorization: headers.Authorization || `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Apollo-Require-Preflight": "true",
        }
    });
};

// Comprehensive error solution

const getGraphQLErrors = (body: Record<"errors", GraphQLFormattedError[] | undefined>):
Error | null => {
    if(!body) {
        return {
            message: 'Unknown error',
            statusCode: 500 // Changed to number
        };
    }
    if("errors" in body) {
        const errors = body?.errors;
        const messages = errors?.map((error) => error?.message)?.join("");
        const code = errors?.[0]?.extensions?.code;

        return {
            message: messages || JSON.stringify(errors), // Corrected syntax
            statusCode: code ? parseInt(code) : 500 // Parse code to number
        };
    }
    return null;
};

// Fetch wrapper

export const fetchWrapper = async (url: string, options: RequestInit) => {
    const response = await customFetch(url, options);

    const responseClone = response.clone();
    const body = await responseClone.json();

    const error = getGraphQLErrors(body);

    if(error) {
        throw error;
    }

    return response;
};
