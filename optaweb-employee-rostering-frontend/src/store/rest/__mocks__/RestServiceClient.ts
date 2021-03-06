/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { getAnswers, postAnswers, putAnswers, deleteAnswers } from 'store/rest/RestTestUtils';

export const mockGet = jest.fn().mockImplementation((url) => {
  const response = getAnswers.get(url);
  if (response instanceof Error) {
    return Promise.reject(response);
  }
  return Promise.resolve(response);
});

export const mockPost = jest.fn().mockImplementation((url, params) => {
  const response = postAnswers.get(url + JSON.stringify(params));
  if (response instanceof Error) {
    return Promise.reject(response);
  }

  return Promise.resolve(response);
});

export const mockPut = jest.fn().mockImplementation((url, params) => {
  const response = putAnswers.get(url + JSON.stringify(params));
  if (response instanceof Error) {
    return Promise.reject(response);
  }

  return Promise.resolve(response);
});

export const mockDelete = jest.fn().mockImplementation((url) => {
  const response = deleteAnswers.get(url);
  if (response instanceof Error) {
    return Promise.reject(response);
  }
  return Promise.resolve(response);
});

export const mockUploadFile = jest.fn().mockImplementation((url, file) => {
  const response = postAnswers.get(url + JSON.stringify(file));
  if (response instanceof Error) {
    return Promise.reject(response);
  }
  return Promise.resolve(response);
});

const mock = jest.fn().mockImplementation(() => ({
  get: mockGet,
  post: mockPost,
  put: mockPut,
  delete: mockDelete,
  uploadFile: mockUploadFile,
}));

export default mock;
