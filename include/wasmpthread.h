#ifndef __WASM_PTHREAD_H__
  #define __WASM_PTHREAD_H__

  #include "./wasmenv.h"
  #include <time.h>

  typedef char wasm_pthread_mutex_attr;

  struct pthread_mutex {
    int atomic;
  };


  typedef struct pthread_mutex wasm_pthread_mutex_t;

  #define WASM_PTHREAD_MUTEX_INITIALIZER {0}

  EM_PORT_API(int) wasm_pthread_mutex_init(wasm_pthread_mutex_t* __restrict mutex, wasm_pthread_mutex_attr* __restrict attr);

  EM_PORT_API(int) wasm_pthread_mutex_destroy(wasm_pthread_mutex_t* mutex);

  EM_PORT_API(int) wasm_pthread_mutex_lock(wasm_pthread_mutex_t* mutex);

  EM_PORT_API(int) wasm_pthread_mutex_unlock(wasm_pthread_mutex_t* mutex);


  typedef char wasm_pthread_condattr_t;
  
  struct pthread_cond {
    int atomic;
  };

  typedef struct pthread_cond wasm_pthread_cond_t;

  // 创建和销毁条件变量
  EM_PORT_API(int) wasm_pthread_cond_init(wasm_pthread_cond_t* cond, const wasm_pthread_condattr_t* attr);
  EM_PORT_API(int) wasm_pthread_cond_destroy(wasm_pthread_cond_t *cond);

  // 等待条件变量满足
  EM_PORT_API(int) wasm_pthread_cond_wait(wasm_pthread_cond_t* cond, wasm_pthread_mutex_t* mutex);
  EM_PORT_API(int) wasm_pthread_cond_timedwait(wasm_pthread_cond_t* cond, wasm_pthread_mutex_t* mutex, const struct timespec* abstime);

  // 信号通知等待条件的线程
  EM_PORT_API(int) wasm_pthread_cond_signal(wasm_pthread_cond_t *cond);
  EM_PORT_API(int) wasm_pthread_cond_broadcast(wasm_pthread_cond_t *cond);

  typedef char wasm_pthread_attr_t;

  struct pthread {
    int id;
    void* retval;
    int flags;
    int status;
  };

  typedef struct pthread wasm_pthread_t;

  struct pthread_once {
    int atomic;
  };

  typedef struct pthread_once wasm_pthread_once_t;

  #define WASM_PTHREAD_ONCE_INIT {0}

  EM_PORT_API(int) wasm_pthread_create(wasm_pthread_t* thread, const wasm_pthread_attr_t* attr, void *(*start_routine)(void *), void* arg);
  EM_PORT_API(int) wasm_pthread_join2(wasm_pthread_t* thread, void** retval);
  EM_PORT_API(void) wasm_pthread_exit(void* retval);
  EM_PORT_API(int) wasm_pthread_detach2(wasm_pthread_t* thread);
  EM_PORT_API(int) wasm_pthread_equal2(wasm_pthread_t* t1, wasm_pthread_t* t2);
  EM_PORT_API(int) wasm_pthread_once(wasm_pthread_once_t *once_control, void (*init_routine)(void));

  #define wasm_pthread_join(thread, retval) \
    wasm_pthread_join2(&thread, retval)
  
  #define wasm_pthread_detach(thread) \
    wasm_pthread_detach2(&thread)

  #define wasm_pthread_equal(t1, t2) \
    wasm_pthread_equal2(&t1, &t2)

#endif