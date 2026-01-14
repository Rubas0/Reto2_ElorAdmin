import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reuniones } from './reuniones';

describe('Reuniones', () => {
  let component: Reuniones;
  let fixture: ComponentFixture<Reuniones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reuniones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reuniones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
