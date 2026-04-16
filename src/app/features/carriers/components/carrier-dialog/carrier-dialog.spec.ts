import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarrierDialog } from './carrier-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Carrier } from '../../carrier';

const mockCarrier: Carrier = {
  id: 1,
  name: 'Test Carrier',
  trackingUrl: 'https://example.com/tracking',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('CarrierDialog', () => {
  let component: CarrierDialog;
  let fixture: ComponentFixture<CarrierDialog>;
  let dialogRefSpy: Partial<MatDialogRef<CarrierDialog>>;

  beforeEach(async () => {
    dialogRefSpy = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CarrierDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { carrier: undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CarrierDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have carrierForm initialized', () => {
    component.ngOnInit();
    expect(component.carrierForm).toBeDefined();
  });

  it('should close dialog with data on valid submit', () => {
    component.ngOnInit();
    component.carrierForm.patchValue({
      name: 'Test',
      trackingUrl: 'https://test.com',
      isActive: true,
    });
    component.onSubmit();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should not close dialog on invalid submit', () => {
    dialogRefSpy.close = vi.fn();
    component.ngOnInit();
    component.onSubmit();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close dialog on cancel', () => {
    dialogRefSpy.close = vi.fn();
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should return false from hasUnsavedChangesFn initially', () => {
    expect(component.hasUnsavedChangesFn()).toBe(false);
  });

  it('should return true from hasUnsavedChangesFn after form changes', () => {
    component.ngOnInit();
    component.carrierForm.patchValue({
      name: 'New Carrier',
      trackingUrl: 'https://new.com',
      isActive: true,
    });
    expect(component.hasUnsavedChangesFn()).toBe(true);
  });

  it('should initialize form with default values', () => {
    component.ngOnInit();
    expect(component.carrierForm.get('name')?.value).toBe('');
    expect(component.carrierForm.get('trackingUrl')?.value).toBe('');
    expect(component.carrierForm.get('isActive')?.value).toBe(true);
  });

  it('should have required validators for name and trackingUrl', () => {
    component.ngOnInit();
    expect(component.carrierForm.get('name')?.validator).not.toBeNull();
    expect(component.carrierForm.get('trackingUrl')?.validator).not.toBeNull();
  });

  it('should have data object available', () => {
    expect(component.data).toBeDefined();
  });
});

describe('CarrierDialog - Edit Mode', () => {
  let component: CarrierDialog;
  let fixture: ComponentFixture<CarrierDialog>;
  let dialogRefSpy: Partial<MatDialogRef<CarrierDialog>>;

  beforeEach(async () => {
    dialogRefSpy = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CarrierDialog],
      providers: [{ provide: MatDialogRef, useValue: dialogRefSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CarrierDialog);
    component = fixture.componentInstance;

    // Manually set the data before ngOnInit
    component.data = { carrier: mockCarrier };
    fixture.detectChanges();
  });

  it('should create in edit mode', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with carrier data', () => {
    component.ngOnInit();
    expect(component.carrierForm.get('name')?.value).toBe('Test Carrier');
    expect(component.carrierForm.get('trackingUrl')?.value).toBe('https://example.com/tracking');
    expect(component.carrierForm.get('isActive')?.value).toBe(true);
  });

  it('should update carrier on valid submit', () => {
    component.ngOnInit();
    component.carrierForm.patchValue({
      name: 'Updated Carrier',
      trackingUrl: 'https://updated.com',
      isActive: false,
    });
    component.onSubmit();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Carrier',
        trackingUrl: 'https://updated.com',
        isActive: false,
      })
    );
  });
});
