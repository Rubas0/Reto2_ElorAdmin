import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Centros } from './centros';

describe('Centros', () => {
  let component: Centros;
  let fixture: ComponentFixture<Centros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Centros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Centros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
