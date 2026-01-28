import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReunionDetalle } from './reunion-detalle';

describe('ReunionDetalle', () => {
  let component: ReunionDetalle;
  let fixture: ComponentFixture<ReunionDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReunionDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReunionDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
