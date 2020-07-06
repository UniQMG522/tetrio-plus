const migrate = (() => {
  const migrations = [];

  function compare(version, target) {
    version = version.split('.').map(n => +n);
    target = target.split('.').map(n => +n);
    for (let i = 0; i < 3; i++) {
      if (version[i] > target[i]) return 1;
      if (version[i] < target[i]) return -1;
    }
    return 0;
  }

  /*
    v0.10.0 - Introduced migrations
    All this version adds is a version tag
  */
  migrations.push({
    version: '0.10.0',
    run: async dataSource => {
      await dataSource.set({ version: '0.10.0' });
    }
  });

  return async function migrate(dataSource) {
    let { version: initialVersion} = await dataSource.get('version');
    if (!initialVersion) initialVersion = '0.0.0';

    for (let migration of migrations) {
      let { version } = await dataSource.get('version');
      if (!version) version = '0.0.0';
      let target = migration.version;

      console.log("Testing migration", version, target, compare(version, target));
      if (compare(version, target) == -1) {
        console.log("Running migration", migration);
        await migration.run(dataSource);
      }
    }

    return {
      from: initialVersion,
      to: (await dataSource.get('version')).version
    };
  }
})();
