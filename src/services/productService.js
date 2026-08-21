import axios from 'axios'

const API_URL = 'http://localhost:8080/api/products'

export const getProducts = (params) => {
  return axios.get(API_URL, { params })
}

export const getProductById = (id) => {
  return axios.get(`${API_URL}/${id}`)
}

export const createProduct = (product) => {
  return axios.post(API_URL, product)
}

export const updateProduct = (product) => {
  return axios.put(API_URL, product)
}

export const patchProduct = (product) => {
  return axios.patch(API_URL, product)
}

export const deleteProduct = (id) => {
  return axios.delete(`${API_URL}/${id}`)
}

export const reduceStock = (products) => {
  return axios.put(`${API_URL}/reduce-stock`, products)
}

export const increaseStock = (products) => {
  return axios.put(`${API_URL}/increase-stock`, products)
}

export const getTotalInventoryValue = () => {
  return axios.get(`${API_URL}/total-value`)
}