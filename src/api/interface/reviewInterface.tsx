export interface RentalInterface {
  success?: boolean;
  DriverReview?: DriverReviewDataInterface;
  loading?: boolean;
}

export interface DriverReviewDataInterface {
  ride_id: number;
  driver_id: number;
  rating: number;
  message: string;
}
