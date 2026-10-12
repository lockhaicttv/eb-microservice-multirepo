import { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import qs from 'qs';

/**
 * Generic REST caller. Signature order is always
 * <Response, RequestParams, RequestPayload>; `data` is the request body and
 * `params` the query string (serialized with qs, repeat for arrays).
 */
const callApi = async <Response, RequestParams = undefined, RequestPayload = undefined>(
  api: AxiosInstance,
  endpoint: string,
  method: Method,
  data?: RequestPayload,
  params?: RequestParams,
  config?: AxiosRequestConfig,
): Promise<Response | undefined> => {
  try {
    const res = (await api({
      ...config,
      method,
      url: endpoint,
      data,
      params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
    })) as unknown as Response;
    return res;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export default callApi;