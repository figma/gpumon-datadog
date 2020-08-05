const { spawn } = require('child_process');
const fetch = require('node-fetch');
const readline = require('readline');
const { StatsD } = require('hot-shots');

const statsD = new StatsD({
  prefix: 'pixie_worker.container_instance.gpu.',
  cacheDns: true,
  maxBufferSize: 512,
});

function main(instance) {
  const child = spawn('bash', ['-c', 'nvidia-smi stats -d gpuUtil,memUtil']);
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    if (!line || line === '') return;
    const [gpu, stat, _ts, value] = line.split(',').map(part => part.trim());
    statsD.histogram(stat, value, [
      `gpu:${gpu}`,
      `instance:${instance}`,
      `env:${process.env.ENV}`,
      `cluster:${process.env.CLUSTER}`,
    ]);
  });
}

fetch('http://169.254.169.254/latest/meta-data/instance-id').then(res => res.text()).then(main);
