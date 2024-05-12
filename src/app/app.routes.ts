import { Routes } from '@angular/router';
import { ModelComponent } from './model/model.component';
import { Model2Component } from './model2/model2.component';

export const routes: Routes = [
    { path: '', component: ModelComponent },
    { path: 'model2', component: Model2Component },
];
