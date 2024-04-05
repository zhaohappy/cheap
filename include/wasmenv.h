#ifndef __WASM_ENV_H__
  #define __WASM_ENV_H__
  /**
   * 声明导出为 js 调用函数
   **/

  #ifndef EM_PORT_API
    #if defined(__EMSCRIPTEN__)
      #include <emscripten.h>
      #if defined(__cplusplus)
        #define EM_PORT_API(rettype) extern "C" rettype EMSCRIPTEN_KEEPALIVE
      #else
        #define EM_PORT_API(rettype) rettype EMSCRIPTEN_KEEPALIVE
      #endif
    #else
      #if defined(__cplusplus)
        #define EM_PORT_API(rettype) extern "C" rettype
      #else
        #define EM_PORT_API(rettype) rettype
      #endif
    #endif
  #endif

  EM_PORT_API(int) wasm_pthread_support();
  EM_PORT_API(int) wasm_cpu_core_count();

#endif