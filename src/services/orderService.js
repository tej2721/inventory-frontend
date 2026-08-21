import axios from 'axios'

const API_URL = 'http://localhost:8081/api/orders'

export const getOrders = () => {
  return axios.get(API_URL)
}

export const getOrderById = (id) => {
  return axios.get(`${API_URL}/${id}`)
}

export const placeOrder = (order) => {
  return axios.post(API_URL, order)
}

export const filterOrders = (status, customerName) => {
  return axios.get(`${API_URL}/filter`, {
    params: {
      status: status || undefined,
      customerName: customerName || undefined,
    },
  })
}

export const cancelOrder = (id) => {
  return axios.post(`${API_URL}/${id}/cancel`)
}

export const deleteOrder = (id) => {
  return axios.delete(`${API_URL}/${id}`)
}