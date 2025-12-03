import { useState, useEffect } from "react";
import ChinaMap from "./components/ChinaMap/ChinaMap";
import ProvinceTasks from "./components/ProvinceTasks/ProvinceTasks";
import TaskList from "./components/TaskList/TaskList";
import QuickLinks from "./components/QuickLinks/QuickLinks";
import "./App.css";

function App() {
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [taskListVisible, setTaskListVisible] = useState(false);
  const [taskListType, setTaskListType] = useState(null); // 'all', 'upcoming', 'provinces'
  const [provinceData, setProvinceData] = useState(() => {
    // 从本地存储加载数据
    const saved = localStorage.getItem("provinceTasks");
    return saved ? JSON.parse(saved) : {};
  });

  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem("provinceTasks", JSON.stringify(provinceData));
  }, [provinceData]);

  const handleProvinceClick = (provinceName) => {
    setSelectedProvince(provinceName);
  };

  const handleSaveProvinceTasks = (provinceName, tasks) => {
    setProvinceData((prev) => {
      const newData = { ...prev };
      // 如果任务数组为空，删除该省份的数据
      if (!tasks || tasks.length === 0) {
        delete newData[provinceName];
      } else {
        newData[provinceName] = tasks;
      }
      return newData;
    });
  };

  // 计算总任务数和即将发版的任务数
  const totalTasks = Object.values(provinceData).reduce(
    (sum, tasks) => sum + (tasks?.length || 0),
    0
  );

  const allTasks = Object.values(provinceData).flat();

  const upcomingReleases = allTasks.filter((task) => {
    if (!task.releaseDate) return false;
    const releaseDate = new Date(task.releaseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return releaseDate >= today;
  });

  // 已配置省份（有任务的省份）
  const configuredProvinces = Object.keys(provinceData).filter(
    (province) => provinceData[province]?.length > 0
  );

  const handleStatClick = (type) => {
    setTaskListType(type);
    setTaskListVisible(true);
  };

  const getTaskListData = () => {
    switch (taskListType) {
      case "all":
        return {
          title: "所有任务",
          tasks: allTasks,
        };
      case "upcoming":
        return {
          title: "即将发版的任务",
          tasks: upcomingReleases,
        };
      case "provinces":
        return {
          title: "已配置省份",
          tasks: configuredProvinces.flatMap((province) =>
            provinceData[province].map((task) => ({
              ...task,
              provinceName: province,
            }))
          ),
        };
      default:
        return { title: "任务列表", tasks: [] };
    }
  };

  return (
    <div className="app">
      {/* 浏览器主页顶部 */}
      <div className="homepage-header">
        <QuickLinks />
      </div>

      {/* 主要内容区域 */}
      <div className="app-content">
        <div className="map-container">
          <ChinaMap
            onProvinceClick={handleProvinceClick}
            provinceData={provinceData}
          />
        </div>
        <div className="tasks-panel">
          {selectedProvince ? (
            <ProvinceTasks
              provinceName={selectedProvince}
              tasks={provinceData[selectedProvince] || []}
              onSave={handleSaveProvinceTasks}
              onClose={() => setSelectedProvince(null)}
            />
          ) : (
            <div className="tasks-placeholder">
              <h3>工作任务管理</h3>
              <p>点击地图上的省份查看和管理该省份的工作任务</p>
              <div className="quick-stats">
                <div
                  className="stat-card clickable"
                  onClick={() => handleStatClick("all")}
                >
                  <div className="stat-number">{totalTasks}</div>
                  <div className="stat-label">总任务数</div>
                </div>
                <div
                  className="stat-card clickable"
                  onClick={() => handleStatClick("upcoming")}
                >
                  <div className="stat-number">{upcomingReleases.length}</div>
                  <div className="stat-label">即将发版</div>
                </div>
                <div
                  className="stat-card clickable"
                  onClick={() => handleStatClick("provinces")}
                >
                  <div className="stat-number">
                    {configuredProvinces.length}
                  </div>
                  <div className="stat-label">已配置省份</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 任务列表弹窗 */}
      <TaskList
        visible={taskListVisible}
        onClose={() => {
          setTaskListVisible(false);
          setTaskListType(null);
        }}
        {...getTaskListData()}
        provinceData={provinceData}
      />
    </div>
  );
}

export default App;
