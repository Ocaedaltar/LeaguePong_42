// CETTE METHODE VA BIENTOT DISPARAITRE.

import React from "react";
import axios from 'axios';
import { useCookies } from "react-cookie";

export const AxiosJwt = () => {
	const [cookies] = useCookies();
	const jwtToken = cookies.access_token;
	const API_URL = "http://localhost:3000" // A CHANGER EN VAR ENV
	const defaultOptions = {
		headers: {
			Authorization: jwtToken ? `Bearer ${jwtToken}` : '',
		},
	};

	const uploadOptions = {
		headers: {
			Authorization: jwtToken ? `Bearer ${jwtToken}` : '',
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
	};

	const uploadFileHeaders = {
		headers: {
			Authorization: jwtToken ? `Bearer ${jwtToken}` : '',
			'Content-Type': 'multipart/form-data',
			Accept: 'multipart/form-data',
		},
	};
	return {
		get: (url: string, options = {}) => axios.get(API_URL + url, { ...defaultOptions, ...options }),
		post: (url: string, data = {}, options = {}) => axios.post(API_URL + url, data, { ...defaultOptions, ...options }),
		postfile: (url: string, data = {}, options = {}) => axios.post(API_URL + url, data, { ...uploadFileHeaders, ...options }),
		put: (url: string, data: string, options = {}) => axios.put(API_URL + url, data, { ...uploadOptions, ...options }),
		delete: (url: string, options = {}) => axios.delete(API_URL + url, { ...defaultOptions, ...options }),
		patch: (url: string, data = {}, options = {}) => axios.patch(API_URL + url, data, { ...uploadOptions, ...options }),
	};
};