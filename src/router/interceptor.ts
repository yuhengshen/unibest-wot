/**
 * by 菲鸽 on 2025-08-19
 * 路由拦截，通常也是登录拦截
 * 黑白名单的配置，请看 config.ts 文件， EXCLUDE_PAGE_LIST
 */
import { useTokenStore } from '@/store/token'
import { tabbarStore } from '@/tabbar/store'
import { getLastPage, parseUrlToObj } from '@/utils/index'
import { EXCLUDE_PAGE_LIST, isNeedLoginMode, LOGIN_PAGE, LOGIN_PAGE_LIST } from './config'

// 黑名单登录拦截器 - （适用于大部分页面不需要登录，少部分页面需要登录）
export const navigateToInterceptor = {
  // 注意，这里的url是 '/' 开头的，如 '/pages/index/index'，跟 'pages.json' 里面的 path 不同
  // 增加对相对路径的处理，BY 网友 @ideal
  invoke({ url, query }: { url: string, query?: Record<string, string> }) {
    if (url === undefined) {
      return
    }
    let { path, query: _query } = parseUrlToObj(url)

    console.log('路由拦截器 1: url->', url, ', query ->', query)
    const myQuery = { ..._query, ...query }
    // /pages/route-interceptor/index?name=feige&age=30
    console.log('路由拦截器 2: path->', path, ', _query ->', _query)
    console.log('路由拦截器 3: myQuery ->', myQuery)

    // 处理相对路径
    if (!path.startsWith('/')) {
      const currentPath = getLastPage()?.route || ''
      const normalizedCurrentPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`
      const baseDir = normalizedCurrentPath.substring(0, normalizedCurrentPath.lastIndexOf('/'))
      path = `${baseDir}/${path}`
    }

    // 处理直接进入路由非首页时，tabbarIndex 不正确的问题
    tabbarStore.setAutoCurIdx(path)

    if (LOGIN_PAGE_LIST.includes(path)) {
      console.log('命中了 LOGIN_PAGE_LIST')
      return
    }

    if (myQuery) {
      path += `?${Object.keys(myQuery).map(key => `${key}=${myQuery[key]}`).join('&')}`
    }
    const redirectUrl = `${LOGIN_PAGE}?redirect=${encodeURIComponent(path)}`

    const tokenStore = useTokenStore()
    console.log('tokenStore.hasLogin:', tokenStore.hasLogin)

    // #region 1/2 需要登录的情况 ---------------------------
    if (isNeedLoginMode) {
      if (tokenStore.hasLogin) {
        return
      }
      else {
        if (EXCLUDE_PAGE_LIST.includes(path)) {
          return
        }
        else {
          console.log('isNeedLogin redirectUrl:', redirectUrl)
          uni.navigateTo({ url: redirectUrl })
        }
      }
    }
    // #endregion 1/2 需要登录的情况 ---------------------------

    // #region 2/2 不需要登录的情况 ---------------------------
    else {
      if (EXCLUDE_PAGE_LIST.includes(path)) {
        console.log('isNeedLogin redirectUrl:', redirectUrl)
        uni.navigateTo({ url: redirectUrl })
      }
    }
    // #endregion 2/2 不需要登录的情况 ---------------------------
  },
}

export const routeInterceptor = {
  install() {
    uni.addInterceptor('navigateTo', navigateToInterceptor)
    uni.addInterceptor('reLaunch', navigateToInterceptor)
    uni.addInterceptor('redirectTo', navigateToInterceptor)
    uni.addInterceptor('switchTab', navigateToInterceptor)
  },
}
