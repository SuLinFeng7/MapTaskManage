import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import "./ChinaMap.css";

const ChinaMap = ({ onProvinceClick, provinceData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const prevProvinceDataRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

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
    const hiddenLabels = [
      "北京市",
      "上海市",
      "香港特别行政区",
      "澳门特别行政区",
    ];

    // 固定的初始缩放和位置配置
    const initialViewState = {
      zoom: 1.5972000000000004, // 缩放比例
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
          emphasis: {
            label: {
              color: "#fff",
              fontSize: 14,
              formatter: function (params) {
                const name = params.name;
                return provinceNameMap[name] || name;
              },
            },
            itemStyle: {
              areaColor: "#ff6b6b",
            },
          },
          itemStyle: {
            areaColor: "#e0f3ff", // 默认颜色
          },
          data: mapData,
        },
      ],
    };

    // 加载中国地图数据并处理名称映射
    const loadMapData = async () => {
      try {
        // 优先尝试从阿里云数据可视化平台加载地图数据
        const response = await fetch(
          "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
        );
        if (response.ok) {
          const geoJson = await response.json();
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
        } else {
          throw new Error("Failed to load map data");
        }
      } catch (error) {
        console.error("加载地图数据失败，尝试备用方案:", error);
        // 备用方案：使用其他CDN
        try {
          const response = await fetch(
            "https://raw.githubusercontent.com/apache/echarts/master/map/json/china.json"
          );
          if (response.ok) {
            const geoJson = await response.json();
            // 处理地图数据
            if (geoJson.features) {
              geoJson.features.forEach((feature) => {
                const originalName = feature.properties.name;
                if (provinceNameMap[originalName]) {
                  feature.properties.originalName = originalName;
                }
              });
            }
            echarts.registerMap("china", geoJson);
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
          }
        } catch (err) {
          console.error("所有地图数据源加载失败:", err);
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
      console.log("设置地图事件监听器...");

      // 监听地图缩放和移动事件（多种事件名称）
      chartInstance.current.off("georoam");
      chartInstance.current.off("maproam");

      // 尝试监听 georoam 事件
      chartInstance.current.on("georoam", function (params) {
        console.log("georoam 事件触发:", params);
        printMapState();
      });

      // 尝试监听 maproam 事件（某些版本的 ECharts）
      chartInstance.current.on("maproam", function (params) {
        console.log("maproam 事件触发:", params);
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

      console.log("地图事件监听器设置完成");
    };

    loadMapData();

    // 更新地图颜色的函数（使用防抖避免频繁更新）
    let updateTimer = null;
    const updateMapColors = () => {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
      updateTimer = setTimeout(() => {
        if (!chartInstance.current) return;
        const allProvinces = Object.keys(provinceNameMap);
        const allProvinceData = allProvinces.map((province) => ({
          name: province,
          value: provinceData[province]?.length || 0,
          itemStyle: {
            areaColor: calculateProvinceColor(province),
          },
        }));
        // 使用merge模式，只更新data部分，不影响其他配置（如emphasis）
        chartInstance.current.setOption(
          {
            series: [
              {
                data: allProvinceData,
              },
            ],
          },
          true // 使用merge模式，避免覆盖emphasis等配置
        );
      }, 100); // 减少防抖延迟到100ms
    };

    // 当 provinceData 更新时，更新地图颜色
    // 只在provinceData真正变化时才更新，避免不必要的重渲染
    const currentDataStr = JSON.stringify(provinceData);
    if (prevProvinceDataRef.current !== currentDataStr) {
      prevProvinceDataRef.current = currentDataStr;
      updateMapColors();
    }

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.off("click");
      chartInstance.current?.off("georoam");
      chartInstance.current?.off("maproam");
    };
  }, [onProvinceClick, provinceData]);

  return (
    <div className="china-map">
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default ChinaMap;
