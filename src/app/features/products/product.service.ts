import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private readonly http = inject(HttpClient);

  loadProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl);
  }
}