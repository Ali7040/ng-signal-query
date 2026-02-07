import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalQuery } from './signal-query';

describe('SignalQuery', () => {
  let component: SignalQuery;
  let fixture: ComponentFixture<SignalQuery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalQuery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignalQuery);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
