import React from "react";
import { render } from "@testing-library/react";
import App from "./App";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { Provider } from "react-redux";
import store from "./redux/store";

jest.mock("axios", () => {
  const mockAxios = jest.fn(() => Promise.resolve({ data: {} }));
  mockAxios.create = jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  }));
  mockAxios.get = jest.fn(() => Promise.resolve({ data: [] }));
  mockAxios.post = jest.fn(() => Promise.resolve({ data: {} }));
  mockAxios.defaults = { headers: { common: {} } };
  return mockAxios;
});

//Smoke Test
test("renders App without crashing", () => {
  axios.get.mockResolvedValue({ data: [] });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </Provider>
  );
});

//Snapshot Test
test("App component matches snapshot", () => {
  axios.get.mockResolvedValue({ data: [] });
  const { asFragment } = render(
    <Provider store={store}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </Provider>
  );

  expect(asFragment()).toMatchSnapshot();
});
