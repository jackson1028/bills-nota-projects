export interface Customer {
  id: string
  name: string
  storeName: string
  address: string
  phone: string
  notaCode: string
}

let customers: Customer[] = [
  {
    id: "1",
    name: "Hady Purnama",
    storeName: "Ranch Market GI",
    address: "Grand Indonesia, Jakarta Pusat",
    phone: "+628123456789",
    notaCode: "GI",
  },
  {
    id: "2",
    name: "Budi Santoso",
    storeName: "Supermarket ABC",
    address: "Jalan Sudirman No. 123, Jakarta",
    phone: "+628234567890",
    notaCode: "ABC",
  },
]

export function getCustomers(): Customer[] {
  return customers
}

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((customer) => customer.id === id)
}

export function createCustomer(customer: Omit<Customer, "id">): Customer {
  const newCustomer = { ...customer, id: (customers.length + 1).toString() }
  customers.push(newCustomer)
  return newCustomer
}

export function updateCustomer(id: string, updatedCustomer: Omit<Customer, "id">): Customer | null {
  const index = customers.findIndex((customer) => customer.id === id)
  if (index !== -1) {
    customers[index] = { ...updatedCustomer, id }
    return customers[index]
  }
  return null
}

export function deleteCustomer(id: string): boolean {
  const initialLength = customers.length
  customers = customers.filter((customer) => customer.id !== id)
  return customers.length < initialLength
}

