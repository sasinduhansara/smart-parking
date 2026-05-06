const BASE_URL = 'http://localhost:5000/api'

export const getParkingSpots = async () => {
  return [
    { id: 1, name: 'Spot A1', available: true, location: 'Level 1' },
    { id: 2, name: 'Spot A2', available: false, location: 'Level 1' },
    { id: 3, name: 'Spot B1', available: true, location: 'Level 2' },
  ]
}
