import { ComponentFixture, TestBed } from '@angular/core/testing';

import { God } from './god';

describe('God', () => {
  let component: God;
  let fixture: ComponentFixture<God>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [God]
    })
    .compileComponents();

    fixture = TestBed.createComponent(God);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
