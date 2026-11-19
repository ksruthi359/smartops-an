import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllOrganizations } from './all-organizations';

describe('AllOrganizations', () => {
  let component: AllOrganizations;
  let fixture: ComponentFixture<AllOrganizations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllOrganizations],
    }).compileComponents();

    fixture = TestBed.createComponent(AllOrganizations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
