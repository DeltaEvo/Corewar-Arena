self.addEventListener("message", msg => {
  const { data } = msg;
  switch (data.topic) {
    case "start":
      start(data.url, data.buffers).then(res => self.postMessage(res));
      break;
  }
});

const decoder = new TextDecoder();

async function start(url, buffers) {
  const memory = new WebAssembly.Memory({
    initial: 2
  });

  const vm = {
    cycle: []
  };

  const env = {
    memory,
    write(fd, address, size) {
      const msg = decoder.decode(
        new Uint8Array(memory.buffer).slice(address, address + size)
      );
      console.log("Write", msg);
    },
    printf() {
      console.log("Printf", arguments);
    },
    exit() {
      console.log("Exit", arguments);
    },
    hook_process_adv(process, diff) {
      vm.cycle.push({
        action: "adv",
        process: (process - vm.processes_offset) / vm.process_size,
        diff
      });
    },
    hook_process_wait_opcode(process, opcode) {
      vm.cycle.push({
        action: "wait_opcode",
        process: (process - vm.processes_offset) / vm.process_size,
        opcode
      });
    },
    hook_process_spawn(process, offset) {
      vm.cycle.push({
        action: "spawn",
        process: (process - vm.processes_offset) / vm.process_size,
        offset
      });
    },
    hook_process_write_memory(process, offset, size) {
      const buffer = new Uint8Array(size);
      const mem = new Uint8Array(memory.buffer, vm.mem_offset, vm.MEM_SIZE);
      while (offset < 0) offset += vm.MEM_SIZE;
      offset %= vm.MEM_SIZE;
      if (offset + size > vm.MEM_SIZE) {
        const diff = vm.MEM_SIZE - offset;
        buffer.set(mem.slice(offset, vm.MEM_SIZE), 0);
        buffer.set(mem.slice(0, size - diff), diff);
      } else buffer.set(mem.slice(offset, offset + size));
      new Uint8Array(memory.buffer).set(buffer, vm.mem_offset + offset);
      vm.cycle.push({
        action: "write_memory",
        process: (process - vm.processes_offset) / vm.process_size,
        from: offset,
        memory: buffer
      });
    },
    hook_cycle_end() {
      self.postMessage(vm.cycle);
      vm.cycle = [];
    },
    before_growth(size) {
      console.log("Before growth", size);
    }
  };

  // Bintray dont set mime type so we can't use instantiateStreaming
  const { instance } = await WebAssembly.instantiate(
    await (await fetch(url)).arrayBuffer(),
    {
      env
    }
  );

  const {
    get_vm_mem_size,
    get_process_size,
    create_vm,
    get_vm_mem,
    get_vm_vec,
    get_vm_vec_processes,
    get_vm_vec_capacity,
    add_process,
    init_process,
    david_needs_to_work
  } = instance.exports;

  const MEM_SIZE = get_vm_mem_size();
  vm.MEM_SIZE = MEM_SIZE;

  console.log("MEM_SIZE", MEM_SIZE);

  vm.pointer = create_vm();
  vm.processes_offset = get_vm_vec_processes(vm.pointer);
  vm.mem_offset = get_vm_mem(vm.pointer);
  vm.process_size = get_process_size();

  console.log("Size", vm.process_size);

  console.log(memory.byteLength);

  const vec = get_vm_vec(vm.pointer);
  console.log("Capacity", get_vm_vec_capacity(vec));
  for (const [i, abuffer] of buffers.entries()) {
    const buffer = new Uint8Array(abuffer);
    const process = add_process(vec);
    const offset = (MEM_SIZE / buffers.length) * i;
    init_process(process, offset, i);
    vm.cycle.push({
      action: "spawn",
      process: i,
      offset
    });
    vm.cycle.push({
      action: "write_memory",
      process: i,
      from: offset,
      memory: buffer
    });
    new Uint8Array(memory.buffer).set(buffer, vm.mem_offset + offset);
  }
  function loop() {
    if (david_needs_to_work(vm.pointer, 1)) setTimeout(loop, 1);
  }
  loop();
  return { MEM_SIZE };
}
