import React from "react";
import { render } from "@testing-library/react";
import App from "./App";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { Provider } from "react-redux";
import store from "./redux/store";

jest.mock("axios");

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
