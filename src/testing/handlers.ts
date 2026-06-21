import { http, HttpResponse } from 'msw';
import customersJson from './fixtures/customers.json';
import productsJson from './fixtures/products.json';
import { User } from '../app/features/users/user';
import { Product } from '../app/features/products/product';
import { setupWorker } from 'msw/browser';

let users: User[] = [...customersJson];
const products: Product[] = productsJson.map(p => ({
  id: p.id,
  title: p.title,
  description: p.description,
  price: p.price,
  category: 'Electronics',
  image: p.imageUrl,
  rating: { rate: 4.5, count: 100 },
}));

export const handlers = [
  http.get('/api/customers', () => {
    return HttpResponse.json(users);
  }),

  http.get('/api/customers/:id', ({ params }) => {
    const user = users.find(c => c.id === Number(params['id']));
    return user ? HttpResponse.json(user) : new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/customers', async ({ request }) => {
    const user = (await request.json()) as User;
    const maxId = users.reduce((m, c) => Math.max(m, c.id), 0);

    const created = { ...user, id: maxId + 1 };
    users.push(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put('/api/customers/:id', async ({ request, params }) => {
    const updated = (await request.json()) as User;
    const id = Number(params['id']);

    users = users.map(c => (c.id === id ? updated : c));

    return HttpResponse.json(updated);
  }),

  http.delete('/api/customers', async ({ request }) => {
    const ids = (await request.json()) as number[];
    users = users.filter(c => !ids.includes(c.id));

    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/products', () => {
    return HttpResponse.json(products);
  }),

  http.get('/api/products/:id', ({ params }) => {
    const product = products.find(p => p.id === Number(params['id']));
    return product ? HttpResponse.json(product) : new HttpResponse(null, { status: 404 });
  }),
];

export const worker = setupWorker(...handlers);
