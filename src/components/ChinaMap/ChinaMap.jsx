import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import "./ChinaMap.css";

const ChinaMap = ({ onProvinceClick, provinceData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const prevProvinceDataRef = useRef(null);
  const mapDataLoadedRef = useRef(false); // 标记地图数据是否已加载
  const updateTimerRef = useRef(null); // 保存更新定时器引用

  // 省份名称映射（全称到简称）
  const provinceNameMap = {
    北京市: "北京",
    天津市: "天津",
    河北省: "河北",
    山西省: "山西",
    内蒙古自治区: "内蒙古",
    辽宁省: "辽宁",
    吉林省: "吉林",
    黑龙江省: "黑龙江",
    上海市: "上海",
    江苏省: "江苏",
    浙江省: "浙江",
    安徽省: "安徽",
    福建省: "福建",
    江西省: "江西",
    山东省: "山东",
    河南省: "河南",
    湖北省: "湖北",
    湖南省: "湖南",
    广东省: "广东",
    广西壮族自治区: "广西",
    海南省: "海南",
    重庆市: "重庆",
    四川省: "四川",
    贵州省: "贵州",
    云南省: "云南",
    西藏自治区: "西藏",
    陕西省: "陕西",
    甘肃省: "甘肃",
    青海省: "青海",
    宁夏回族自治区: "宁夏",
    新疆维吾尔自治区: "新疆",
    香港特别行政区: "香港",
    澳门特别行政区: "澳门",
    台湾省: "台湾",
  };

  // 需要隐藏标签的地区
  const hiddenLabels = ["北京市", "上海市", "香港特别行政区", "澳门特别行政区"];

  // 固定的初始缩放和位置配置
  const initialViewState = {
    zoom: 1.2072000000000004, // 缩放比例
    center: [104.64832355210311, 36.06953268677697], // 中心点坐标 [longitude, latitude]
  };

  // 计算省份颜色（根据最近的发版时间）
  const calculateProvinceColor = (provinceName) => {
    const tasks = provinceData[provinceName] || [];
    if (tasks.length === 0) {
      return "#e0f3ff"; // 默认浅蓝色
    }

    // 找到最近的待发版任务
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTasks = tasks
      .filter((task) => {
        if (!task.releaseDate) return false;
        const releaseDate = new Date(task.releaseDate);
        return releaseDate >= today;
      })
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

    if (upcomingTasks.length === 0) {
      return "#51cf66"; // 绿色：没有待发版任务
    }

    const nearestRelease = new Date(upcomingTasks[0].releaseDate);
    const diffTime = nearestRelease - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return "#51cf66"; // 绿色：7天以上
    }

    // 7天内：从绿色渐变到红色
    // diffDays: 7 -> 绿色, 0 -> 红色
    const ratio = diffDays / 7; // 0-1之间

    // RGB颜色插值：绿色(81, 207, 102) -> 红色(255, 107, 107)
    const greenR = 81;
    const greenG = 207;
    const greenB = 102;
    const redR = 255;
    const redG = 107;
    const redB = 107;

    const r = Math.round(greenR + (redR - greenR) * (1 - ratio));
    const g = Math.round(greenG + (redG - greenG) * (1 - ratio));
    const b = Math.round(greenB + (redB - greenB) * (1 - ratio));

    return `rgb(${r}, ${g}, ${b})`;
  };

  // 打印地图状态的函数
  const printMapState = () => {
    try {
      const option = chartInstance.current.getOption();
      const seriesOption = option.series && option.series[0];

      let zoom = seriesOption?.zoom || 1.2;
      let center = seriesOption?.center || [104.0, 35.0];

      // 打印当前状态（用于调试）
      console.log("=== 地图状态信息 ===");
      console.log("缩放比例 (zoom):", zoom);
      console.log("中心点坐标 (center):", center);
      console.log("完整配置对象:", {
        zoom: zoom,
        center: center,
      });
      console.log("复制此配置到 initialViewState:");
      console.log(`zoom: ${zoom},`);
      console.log(`center: [${center[0]}, ${center[1]}],`);
      console.log("==================");
    } catch (error) {
      console.error("获取地图状态失败:", error);
    }
  };

  // 监听地图缩放和移动事件的函数
  const setupMapEventListeners = () => {
    // 监听地图缩放和移动事件
    chartInstance.current.off("georoam");
    chartInstance.current.off("maproam");

    // 监听 georoam 事件
    chartInstance.current.on("georoam", function () {
      printMapState();
    });

    // 监听 maproam 事件（某些版本的 ECharts）
    chartInstance.current.on("maproam", function () {
      printMapState();
    });

    // 监听鼠标滚轮事件（缩放）
    const chartDom = chartInstance.current.getDom();
    if (chartDom) {
      chartDom.addEventListener("wheel", () => {
        setTimeout(printMapState, 100);
      });

      // 监听鼠标移动事件（拖拽）
      let isDragging = false;
      chartDom.addEventListener("mousedown", () => {
        isDragging = true;
      });
      chartDom.addEventListener("mouseup", () => {
        if (isDragging) {
          setTimeout(printMapState, 100);
          isDragging = false;
        }
      });
    }

    // 监听点击事件
    chartInstance.current.off("click");
    chartInstance.current.on("click", (params) => {
      if (params.componentType === "series") {
        onProvinceClick(params.name);
      }
    });
  };

  // 初始化地图和加载地图数据（只执行一次）
  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 如果地图数据已加载，不再重复加载
    if (mapDataLoadedRef.current) return;

    // 准备地图数据 - 包含所有有任务的省份
    const mapData = Object.keys(provinceData)
      .filter((province) => provinceData[province]?.length > 0)
      .map((province) => ({
        name: province,
        value: provinceData[province].length,
        itemStyle: {
          areaColor: calculateProvinceColor(province),
        },
      }));

    const option = {
      tooltip: {
        trigger: "item",
        formatter: function (params) {
          const provinceName = params.name;
          const displayName = provinceNameMap[provinceName] || provinceName;
          const tasks = provinceData[provinceName];
          const taskCount = tasks?.length || 0;
          if (taskCount > 0) {
            return `${displayName}<br/>任务数: ${taskCount}`;
          }
          return `${displayName}<br/>点击添加任务`;
        },
      },
      series: [
        {
          name: "省份",
          type: "map",
          map: "china",
          roam: true,
          zoom: initialViewState.zoom,
          center: initialViewState.center,
          selectedMode: false,
          label: {
            show: true,
            fontSize: 12,
            color: "#333",
            formatter: function (params) {
              const name = params.name;
              // 隐藏特定地区的标签
              if (hiddenLabels.includes(name)) {
                return "";
              }
              // 返回简称
              return provinceNameMap[name] || name;
            },
          },
          itemStyle: {
            areaColor: "#e0f3ff", // 默认颜色
          },
          data: mapData,
        },
      ],
    };

    // 处理地图数据的通用函数
    const processMapData = (geoJson) => {
      // 处理地图数据，修改地区名称
      if (geoJson.features) {
        geoJson.features.forEach((feature) => {
          const originalName = feature.properties.name;
          // 修改名称映射
          if (provinceNameMap[originalName]) {
            // 保留原始名称用于数据匹配，但显示时使用简称
            feature.properties.originalName = originalName;
          }
        });
      }
      echarts.registerMap("china", geoJson);
      mapDataLoadedRef.current = true; // 标记地图数据已加载

      // 应用地图配置
      chartInstance.current.setOption(option);

      // 地图加载完成后，应用初始状态
      setTimeout(() => {
        chartInstance.current.setOption({
          series: [
            {
              zoom: initialViewState.zoom,
              center: initialViewState.center,
            },
          ],
        });
        setupMapEventListeners();
      }, 200);

      // 地图加载后，为所有省份设置颜色
      setTimeout(() => {
        const allProvinces = Object.keys(provinceNameMap);
        const allProvinceData = allProvinces.map((province) => ({
          name: province,
          value: provinceData[province]?.length || 0,
          itemStyle: {
            areaColor: calculateProvinceColor(province),
          },
        }));
        chartInstance.current.setOption({
          series: [
            {
              data: allProvinceData,
            },
          ],
        });
      }, 100);
    };

    // 加载中国地图数据并处理名称映射
    const loadMapData = async () => {
      try {
        // 优先从本地文件加载地图数据
        const response = await fetch("/data/china.json");
        if (response.ok) {
          const geoJson = await response.json();
          processMapData(geoJson);
        } else {
          throw new Error("本地地图数据加载失败");
        }
      } catch (error) {
        console.error("从本地加载地图数据失败，尝试在线数据源:", error);
        // 备用方案1：尝试从阿里云数据可视化平台加载
        try {
          const response = await fetch(
            "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
          );
          if (response.ok) {
            const geoJson = await response.json();
            processMapData(geoJson);
          } else {
            throw new Error("阿里云数据源加载失败");
          }
        } catch (err1) {
          console.error("阿里云数据源加载失败，尝试GitHub数据源:", err1);
          // 备用方案2：使用GitHub数据源
          try {
            const response = await fetch(
              "https://raw.githubusercontent.com/apache/echarts/master/map/json/china.json"
            );
            if (response.ok) {
              const geoJson = await response.json();
              processMapData(geoJson);
            } else {
              throw new Error("GitHub数据源加载失败");
            }
          } catch (err2) {
            console.error("所有地图数据源加载失败:", err2);
            // 显示错误提示
            chartInstance.current.setOption({
              title: {
                text: "地图加载失败，请检查网络连接",
                left: "center",
                top: "middle",
                textStyle: { color: "#999" },
              },
            });
          }
        }
      }
    };

    loadMapData();

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.off("click");
      chartInstance.current?.off("georoam");
      chartInstance.current?.off("maproam");
    };
  }, []); // 只在组件挂载时执行一次

  // 单独处理数据更新，只更新颜色，不重新加载地图
  useEffect(() => {
    // 如果地图数据还没加载，不执行更新
    if (!chartInstance.current || !mapDataLoadedRef.current) {
      return;
    }

    // 更新地图颜色的函数（使用防抖避免频繁更新）
    const updateMapColors = () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = setTimeout(() => {
        // 再次检查地图实例和数据加载状态
        if (
          !chartInstance.current ||
          !mapDataLoadedRef.current ||
          !chartRef.current
        ) {
          return;
        }

        // 检查DOM元素是否有效
        const chartDom = chartRef.current;
        if (
          !chartDom ||
          chartDom.offsetWidth === 0 ||
          chartDom.offsetHeight === 0
        ) {
          console.warn("地图容器尺寸无效，跳过更新");
          return;
        }

        // 检查地图实例是否仍然有效
        try {
          const currentOption = chartInstance.current.getOption();
          if (
            !currentOption ||
            !currentOption.series ||
            currentOption.series.length === 0
          ) {
            console.warn("地图配置丢失，跳过更新");
            return;
          }

          // 检查地图类型是否正确
          const firstSeries = currentOption.series[0];
          if (
            !firstSeries ||
            firstSeries.type !== "map" ||
            firstSeries.map !== "china"
          ) {
            console.warn("地图类型不匹配，跳过更新");
            return;
          }
        } catch (error) {
          console.error("获取地图配置失败:", error);
          return;
        }

        const allProvinces = Object.keys(provinceNameMap);
        const allProvinceData = allProvinces.map((province) => {
          try {
            return {
              name: province,
              value: provinceData[province]?.length || 0,
              itemStyle: {
                areaColor: calculateProvinceColor(province),
              },
            };
          } catch (error) {
            console.error(`计算省份 ${province} 颜色失败:`, error);
            return {
              name: province,
              value: provinceData[province]?.length || 0,
              itemStyle: {
                areaColor: "#e0f3ff", // 默认颜色
              },
            };
          }
        });

        // 检查数据是否有效
        if (!allProvinceData || allProvinceData.length === 0) {
          console.warn("省份数据为空，跳过更新");
          return;
        }

        // 使用merge模式，只更新data部分
        // 注意：不指定type和map，让ECharts自动保留现有配置
        try {
          // 先获取当前配置，确保地图配置存在
          const currentOption = chartInstance.current.getOption();
          if (
            !currentOption ||
            !currentOption.series ||
            currentOption.series.length === 0
          ) {
            console.warn("地图配置不存在，跳过更新");
            return;
          }

          chartInstance.current.setOption(
            {
              series: [
                {
                  data: allProvinceData,
                },
              ],
            },
            {
              notMerge: false, // 使用merge模式
              lazyUpdate: false, // 立即更新
            }
          );

          // 更新后再次检查地图是否仍然存在
          setTimeout(() => {
            try {
              const afterOption = chartInstance.current.getOption();
              if (
                !afterOption ||
                !afterOption.series ||
                afterOption.series.length === 0
              ) {
                console.error("地图在更新后丢失！");
              }
            } catch (error) {
              console.error("检查地图状态失败:", error);
            }
          }, 100);
        } catch (error) {
          console.error("更新地图颜色失败:", error);
          console.error("错误详情:", error.stack);
        }
      }, 150); // 稍微增加延迟，确保地图完全准备好
    };

    // 当 provinceData 更新时，更新地图颜色
    const currentDataStr = JSON.stringify(provinceData);
    if (prevProvinceDataRef.current !== currentDataStr) {
      prevProvinceDataRef.current = currentDataStr;
      updateMapColors();
    } else if (prevProvinceDataRef.current === null) {
      // 首次初始化
      prevProvinceDataRef.current = currentDataStr;
    }

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [provinceData]);

  return (
    <div className="china-map">
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default ChinaMap;
