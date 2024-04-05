#ifndef __WASM_SEMAPHORE_H__
    #define __WASM_SEMAPHORE_H__

    #include "./wasmenv.h"
    #include "./wasmpthread.h"

    struct sem {
        int atomic;
        struct pthread_mutex mutex;
    };

    typedef struct sem wasm_sem_t;

    // 创建和销毁信号量
    EM_PORT_API(int) wasm_sem_init(wasm_sem_t *sem, int pshared, unsigned int value);
    EM_PORT_API(int) wasm_sem_destroy(wasm_sem_t *sem);

    // 信号量操作
    EM_PORT_API(int) wasm_sem_wait(wasm_sem_t *sem);
    EM_PORT_API(int) wasm_sem_trywait(wasm_sem_t *sem);
    EM_PORT_API(int) wasm_sem_timedwait(wasm_sem_t* sem, const struct timespec* abstime);
    EM_PORT_API(int) wasm_sem_post(wasm_sem_t *sem);
#endif