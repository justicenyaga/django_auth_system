import { createSlice } from "@reduxjs/toolkit";
import { apiCallBegun } from "./api";
import httpService from "../utils/httpService";

const slice = createSlice({
  name: "auth",
  initialState: {
    access: localStorage.getItem("access"),
    refresh: localStorage.getItem("refresh"),
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    authStarted: (auth, action) => {
      auth.loading = true;
    },

    authSuccess: (auth, action) => {
      localStorage.setItem("access", action.payload.access);

      auth.isAuthenticated = true;
      auth.access = action.payload.access;
      auth.refresh = action.payload.refresh;
      auth.loading = false;
      auth.error = null;
    },

    userLoaded: (auth, action) => {
      auth.user = action.payload;
      auth.loading = false;
    },

    userLoadingFailed: (auth, action) => {
      auth.user = null;
      auth.loading = false;
    },

    authFailed: (auth, action) => {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      auth.isAuthenticated = false;
      auth.access = null;
      auth.refresh = null;
      auth.error = action.payload;
      auth.loading = false;
    },

    authenticationVerified: (auth, action) => {
      auth.isAuthenticated = true;
    },

    authenticationFailed: (auth, action) => {
      auth.isAuthenticated = false;
    },

    loggedOut: (auth, action) => {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      auth.isAuthenticated = false;
      auth.access = null;
      auth.refresh = null;
      auth.user = null;

      auth.error = null;
    },
  },
});

const {
  authStarted,
  authSuccess,
  userLoaded,
  userLoadingFailed,
  authFailed,
  authenticationVerified,
  authenticationFailed,
  loggedOut,
} = slice.actions;
export default slice.reducer;

export const checkAuthenticated = () => async (dispatch) => {
  const access = localStorage.getItem("access");

  if (access) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const data = { token: access };

    try {
      const response = await httpService.post(
        "/auth/jwt/verify/",
        data,
        headers
      );

      if (response.data.code !== "token_not_valid") {
        await dispatch(authenticationVerified());
      }
    } catch (error) {
      dispatch(authenticationFailed());
    }
  } else {
    dispatch(authenticationFailed());
  }
};

export const loadUser = () => (dispatch) => {
  const access = localStorage.getItem("access");

  if (access) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `JWT ${access}`,
      Accept: "application/json",
    };

    dispatch(
      apiCallBegun({
        url: "/auth/users/me/",
        method: "GET",
        headers,
        onStart: authStarted.type,
        onSuccess: userLoaded.type,
        onError: userLoadingFailed.type,
      })
    );
  } else {
    dispatch(userLoadingFailed());
  }
};

export const login = (email, password) => async (dispatch) => {
  const headers = {
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({ email, password });

  await dispatch(
    apiCallBegun({
      url: "/auth/jwt/create/",
      method: "POST",
      data: body,
      headers,
      onStart: authStarted.type,
      onSuccess: authSuccess.type,
      onError: authFailed.type,
    })
  );

  dispatch(loadUser());
};

export const logout = () => (dispatch) => {
  dispatch({ type: loggedOut.type });
};