/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
  },
  async rewrites() {
    return [
      {
        source: '/strk-incentives/:path*',
        destination:
          'https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/starknet/:path*',
      },
      {
        source: '/zklend/:path*',
        destination: 'https://app.zklend.com/:path*',
      },
      {
        source: '/jediswap/:path*',
        destination: 'https://api.jediswap.xyz/:path*',
      },
      {
        source: '/ekubo/:path*',
        destination: 'https://mainnet-api.ekubo.org/:path*',
      },
      {
        source: '/haiko/:path*',
        destination: 'https://app.haiko.xyz/api/v1/:path*',
      },
      {
        source: '/nostra/:path*',
        destination: 'https://us-east-2.aws.data.mongodb-api.com/:path*',
      },
      {
        source: '/carmine/:path*',
        destination: 'https://api.carmine.finance/:path*',
      },
      {
        source: '/myswap/:path*',
        destination: 'https://myswap-cl-charts.s3.amazonaws.com/:path*',
      },
      {
        source: '/nimbora/:path*',
        destination: 'https://stats.nimbora.io/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/usdc',
        destination: '/strategy/usdc_sensei',
        permanent: true,
      },
      {
        source: '/strk',
        destination: '/strategy/strk_sensei',
        permanent: true,
      },
      {
        source: '/eth',
        destination: '/strategy/eth_sensei',
        permanent: true,
      },
      {
        source: '/tnc/v1',
        destination:
          'https://github.com/strkfarm/static-assets/blob/177389cad715d69245c1b125df87f90318ac2d7b/tnc.pdf',
        permanent: true,
      },
    ];
  },
  webpack(config, options) {
    if (options.isServer) config.devtool = 'source-map';
    return config;
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
