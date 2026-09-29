import axios from "axios"

/**
 * Global Axios instance configured with CORS credentials support.
 */
export const axiosInstance = axios.create({
  withCredentials: true,
});

/**
 * Generic API connector wrapper executing HTTP requests with Axios.
 *
 * @param {string} method HTTP method ('GET', 'POST', 'PUT', 'DELETE', etc.)
 * @param {string} url Request URL endpoint
 * @param {object|null} bodyData Request payload body
 * @param {object|null} headers Custom HTTP request headers
 * @param {object|null} params URL query parameters
 * @returns {Promise<AxiosResponse>}
 */
export const apiConnector = (method, url, bodyData, headers, params) => {
    return axiosInstance({
        method:`${method}`,
        url:`${url}`,
        data: bodyData ? bodyData : null,
        headers: headers ? headers: null,
        params: params ? params : null,
    });
}