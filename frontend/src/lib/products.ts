export interface Product {
  id: string;
  category: string;
  title: string;
  image: string;
  price: number;
  description: string;
  specs: Record<string, string>;
  inStock: boolean;
}

export const ALL_PRODUCTS: Product[] = [
  {
    id: '1',
    category: 'Drivetrain',
    title: 'Hyper-Glide 12-Speed Cassette',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ58Uth6QDaFQZ7vJ5YRINbtd9UBCv-NaCrUe6ZEUQnVGyOy4ND7Mkb9MdYHyBqZzW3xAzBX-gRhLV1SCqkBhqwiENb3j0xuamwu0clagSGSiJRduBL2JosOdzuvFXo2xfN9nUShCS1dzDl3hFA6KXlAxUeyOJxhI5iJwStjnuJzgEmape3ntnN8xf8ADkEzujilqaNAe9ElxYMpDkVQrDXnZaevE8bMhaL5KJsW_QhT8aifF-9KdPtFwbRQs0-L5xIJRXH2FPO6s',
    price: 249.00,
    description: 'Professional-grade 12-speed cassette engineered for smooth, precise gear transitions. Built with hardened steel cogs for durability and consistent performance in all conditions.',
    specs: {
      'Speed': '12-speed',
      'Material': 'Hardened Steel',
      'Weight': '285g',
      'Compatibility': 'Shimano/SRAM 12-speed',
      'Warranty': '1 Year'
    },
    inStock: true
  },
  {
    id: '2',
    category: 'Wheels',
    title: 'AeroVance 50mm Carbon Set',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD86XLtcK3Ex_AvSYQw7jVC3RopqgSlZdY_WJFUFwmfq3dPld3DyAw20ghXcxXoMt9vg057Iy0xhDLd2GMN1NPDXPFNSzx4jHDaypPU4CCuAMW7VMEJL02LUYrUMDTM8ITOr2Zugu8Brry9eTSDaDNgJoZcRqlYSQhChTxUgr5EcYIjwO6hTrKwqE4RUbkM6QA3Dc6ExHzgK7eA9_4MPExG-BbhHWsQ6i1Xl5Rz8jBP1iZU8DKANixgo-XSkxpIihQmhLJy2UbeIvw',
    price: 1899.00,
    description: 'Ultimate aerodynamic performance with 50mm carbon depth. Designed for speed-focused riders seeking minimal wind resistance and maximum acceleration.',
    specs: {
      'Depth': '50mm',
      'Material': 'Carbon Fiber',
      'Weight': '1200g (pair)',
      'Rim Brake': 'Yes',
      'Tire Width': '25-28mm'
    },
    inStock: false
  },
  {
    id: '3',
    category: 'Cockpit',
    title: 'ErgoRide S-Pro Saddle',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2upaFBsjMeDd433Uj_IDji3-PAxqNQRZRzCrkRQDcaV7o55o9A0ZY4N7PONzhOiB-JKyEzr6qM-FrYZAdOrdKsPnUhLosb9VXBbUxXLq4Z0R3_i5UcNs7f8vneOQc24pGYbd59N0BHc7MTEqChaIfIkDHKBvPc2mvci4RssBJOyjM9V7dkUnkUTbAtuEXTUjnun2O0dAMXqjM5PVWB3-QNxsANLkLcPgJbPaOUNtpBABHkU2r_FmJxnX6G1-dltxLUD2oEf4fwBQ',
    price: 179.00,
    description: 'Ergonomically designed saddle with pressure-relieving channel and premium memory foam. Engineered for maximum comfort on long-distance rides.',
    specs: {
      'Length': '275mm',
      'Width': '138mm',
      'Material': 'Synthetic + Memory Foam',
      'Weight': '195g',
      'Rail': 'Titanium'
    },
    inStock: true
  },
  {
    id: '4',
    category: 'Braking',
    title: 'Direct-Stop Carbon Calipers',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTEK7XjRfZ8DTSI_4S7AtBbra1YNHqETcuBzRZLtFlZjXxnFBrE-5lw2e9rEN13A6eyZECxjVnW3ym5Vsc2cFzMof8mt0-jE2527qWdzi1BuG-xC_S-fPfxmX_5JM0HpNKUnokRXWNa8wqe-kANZpmht76XwvmgE_21xodZdM9rtAi8g08XAY3tEGgybMJR7NT4vio9eFdWs9JbLWn6KF0IO8Oy8_9EUo5CsnulseVm6Kc5SJznpAqOf5aDyv3LESELl9DuFuXKOI',
    price: 315.00,
    description: 'High-performance carbon brake calipers with direct-mount compatibility. Delivers responsive, consistent braking power in all weather conditions.',
    specs: {
      'Mount': 'Direct Mount (Front/Rear)',
      'Material': 'Carbon Composite',
      'Weight': '180g (pair)',
      'Reach': '39-49mm',
      'Pad Type': 'Cartridge'
    },
    inStock: true
  },
  {
    id: '5',
    category: 'Drivetrain',
    title: 'Premium Chain Link Pro',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ58Uth6QDaFQZ7vJ5YRINbtd9UBCv-NaCrUe6ZEUQnVGyOy4ND7Mkb9MdYHyBqZzW3xAzBX-gRhLV1SCqkBhqwiENb3j0xuamwu0clagSGSiJRduBL2JosOdzuvFXo2xfN9nUShCS1dzDl3hFA6KXlAxUeyOJxhI5iJwStjnuJzgEmape3ntnN8xf8ADkEzujilqaNAe9ElxYMpDkVQrDXnZaevE8bMhaL5KJsW_QhT8aifF-9KdPtFwbRQs0-L5xIJRXH2FPO6s',
    price: 189.00,
    description: 'Ultra-durable chain with enhanced wear resistance. Low friction design ensures smooth power transfer and extended lifespan.',
    specs: {
      'Speed': '12-speed Compatible',
      'Material': 'Nickel-plated Steel',
      'Weight': '275g',
      'Length': '1/2\" x 11/128\"',
      'Links': '116'
    },
    inStock: true
  },
  {
    id: '6',
    category: 'Wheels',
    title: 'SpeedWave 30mm Set',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD86XLtcK3Ex_AvSYQw7jVC3RopqgSlZdY_WJFUFwmfq3dPld3DyAw20ghXcxXoMt9vg057Iy0xhDLd2GMN1NPDXPFNSzx4jHDaypPU4CCuAMW7VMEJL02LUYrUMDTM8ITOr2Zugu8Brry9eTSDaDNgJoZcRqlYSQhChTxUgr5EcYIjwO6hTrKwqE4RUbkM6QA3Dc6ExHzgK7eA9_4MPExG-BbhHWsQ6i1Xl5Rz8jBP1iZU8DKANixgo-XSkxpIihQmhLJy2UbeIvw',
    price: 1299.00,
    description: 'Balanced aerodynamics with improved handling. Perfect for mixed terrain riding with excellent all-around performance characteristics.',
    specs: {
      'Depth': '30mm',
      'Material': 'Carbon Fiber',
      'Weight': '1050g (pair)',
      'Rim Brake': 'Yes',
      'Tire Width': '23-25mm'
    },
    inStock: false
  },
  {
    id: '7',
    category: 'Cockpit',
    title: 'Carbon Drop Bars Elite',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2upaFBsjMeDd433Uj_IDji3-PAxqNQRZRzCrkRQDcaV7o55o9A0ZY4N7PONzhOiB-JKyEzr6qM-FrYZAdOrdKsPnUhLosb9VXBbUxXLq4Z0R3_i5UcNs7f8vneOQc24pGYbd59N0BHc7MTEqChaIfIkDHKBvPc2mvci4RssBJOyjM9V7dkUnkUTbAtuEXTUjnun2O0dAMXqjM5PVWB3-QNxsANLkLcPgJbPaOUNtpBABHkU2r_FmJxnX6G1-dltxLUD2oEf4fwBQ',
    price: 229.00,
    description: 'Premium carbon drop bars with comfort-focused ergonomics. Multiple hand positions provide versatility for different riding scenarios.',
    specs: {
      'Wide': '420mm (Center-to-Center)',
      'Drop': '130mm',
      'Material': 'Carbon Fiber',
      'Weight': '218g',
      'Reach': '75mm'
    },
    inStock: true
  },
  {
    id: '8',
    category: 'Braking',
    title: 'Hydraulic Disc Brake Set',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTEK7XjRfZ8DTSI_4S7AtBbra1YNHqETcuBzRZLtFlZjXxnFBrE-5lw2e9rEN13A6eyZECxjVnW3ym5Vsc2cFzMof8mt0-jE2527qWdzi1BuG-xC_S-fPfxmX_5JM0HpNKUnokRXWNa8wqe-kANZpmht76XwvmgE_21xodZdM9rtAi8g08XAY3tEGgybMJR7NT4vio9eFdWs9JbLWn6KF0IO8Oy8_9EUo5CsnulseVm6Kc5SJznpAqOf5aDyv3LESELl9DuFuXKOI',
    price: 425.00,
    description: 'Advanced hydraulic disc brakes with superior modulation and power. The ultimate choice for controlled, responsive braking in demanding conditions.',
    specs: {
      'Type': 'Hydraulic Disc',
      'Fluid': 'DOT 5.1',
      'Rotor Size': '160mm (Front/Rear)',
      'Weight': '350g (pair)',
      'Pad Type': 'Metallic'
    },
    inStock: true
  }
];

export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find(product => product.id === id);
}
